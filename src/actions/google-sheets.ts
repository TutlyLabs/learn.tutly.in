import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import db from "@/lib/db";
import { defineAction } from "astro:actions";

const initializeGoogleClient = async () => {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: import.meta.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: import.meta.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive.file"
    ],
  });

  return google.sheets({ version: "v4", auth });
};

export const exportToGoogleSheets = defineAction({
  async handler({ title, headers, data, courseId }, { locals }) {
    const user = locals.user;

    if (!user || (user.role !== "INSTRUCTOR" && user.role !== "MENTOR")) {
      return {
        error: "Unauthorized"
      };
    }

    try {
      const sheets = await initializeGoogleClient();

      const spreadsheet = await sheets.spreadsheets.create({
        requestBody: {
          properties: {
            title,
          },
          sheets: [
            {
              properties: {
                title: "Report Data",
              },
            },
          ],
        },
      });

      const spreadsheetId = spreadsheet.data.spreadsheetId;

      if (!spreadsheetId) {
        throw new Error("Failed to create spreadsheet");
      }

      const values = [headers, ...data];

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "Report Data!A1",
        valueInputOption: "RAW",
        requestBody: {
          values,
        },
      });

      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId: 0,
                  startRowIndex: 0,
                  endRowIndex: 1,
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: {
                      red: 0.2,
                      green: 0.2,
                      blue: 0.8,
                    },
                    textFormat: {
                      bold: true,
                      foregroundColor: {
                        red: 1.0,
                        green: 1.0,
                        blue: 1.0,
                      },
                    },
                  },
                },
                fields: "userEnteredFormat(backgroundColor,textFormat)",
              },
            },
            {
              autoResizeDimensions: {
                dimensions: {
                  sheetId: 0,
                  dimension: "COLUMNS",
                  startIndex: 0,
                  endIndex: headers.length,
                },
              },
            },
          ],
        },
      });

      const auth = sheets.context._options.auth;
      if (!auth) {
        throw new Error("Auth not found");
      }

      const drive = google.drive({
        version: "v3",
        auth: auth as OAuth2Client
      });

      try {
        await drive.permissions.create({
          fileId: spreadsheetId,
          requestBody: {
            role: "reader",
            type: "anyone",
          },
        });
      } catch (error) {
        console.error("Error setting 'anyone' permission:", error);
      }

      try {
        await db.reportSheet.upsert({
          where: {
            courseId_reportType: {
              courseId: courseId,
              reportType: "STUDENT_PERFORMANCE",
            },
          },
          update: {
            spreadsheetId,
            lastUpdated: new Date(),
          },
          create: {
            courseId: courseId,
            spreadsheetId,
            reportType: "STUDENT_PERFORMANCE",
            lastUpdated: new Date(),
          },
        });
      } catch (dbError) {
        console.error("Error storing spreadsheet ID in database:", dbError);
      }

      const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

      return {
        data: {
          success: true,
          url,
          spreadsheetId,
        }
      };
    } catch (error) {
      console.error("Error creating Google Sheet:", error);
      return {
        error: "Failed to create Google Sheet: " + (error instanceof Error ? error.message : String(error))
      };
    }
  },
});
