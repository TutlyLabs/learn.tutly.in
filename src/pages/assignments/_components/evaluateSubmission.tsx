import { actions } from "astro:actions";
import { useState } from "react";
import toast from "react-hot-toast";

import day from "@/lib/dayjs";

const EvaluateSubmission = ({
  submission,
  showActions,
}: {
  submission: any;
  showActions: boolean;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedScores, setEditedScores] = useState({
    responsiveness: 0,
    styling: 0,
    other: 0,
  });
  const [feedback, setFeedback] = useState<string | null>(submission.overallFeedback || null);

  const rValue = submission.points.find((point: any) => point.category === "RESPOSIVENESS");
  const sValue = submission.points.find((point: any) => point.category === "STYLING");
  const oValue = submission.points.find((point: any) => point.category === "OTHER");

  const totalScore = [rValue, sValue, oValue].reduce((acc, currentValue) => {
    return acc + (currentValue ? currentValue.score : 0);
  }, 0);

  const handleFeedback = async (submissionId: string) => {
    try {
      if (!feedback) return;
      await actions.submissions_addOverallFeedback({
        submissionId,
        feedback,
      });
      toast.success("Feedback saved successfully");
    } catch (e: any) {
      toast.error("Failed to save feedback");
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    const rValue = submission?.points.find((point: any) => point.category === "RESPOSIVENESS");
    const sValue = submission?.points.find((point: any) => point.category === "STYLING");
    const oValue = submission?.points.find((point: any) => point.category === "OTHER");
    setEditedScores({
      responsiveness: rValue ? rValue.score : 0,
      styling: sValue ? sValue.score : 0,
      other: oValue ? oValue.score : 0,
    });
  };

  const handleSave = async () => {
    try {
      toast.loading("Updating Scores...");

      const marks = Object.entries(editedScores)
        .filter(([_, score]) => score > 0)
        .map(([category, score]) => ({
          category: category.toUpperCase(),
          score,
        }));

      await actions.points_addPoints({
        submissionId: submission.id,
        marks,
      });

      if (feedback) {
        await handleFeedback(submission.id);
      }

      setIsEditing(false);
      toast.dismiss();
      toast.success("Scores saved successfully");
      window.location.reload();
    } catch (e: any) {
      toast.dismiss();
      toast.error("Failed to save scores");
    }
  };

  const handleDelete = async () => {
    const response = confirm("Are you sure you want to delete this submission?");
    if (!response) return;

    try {
      toast.loading("Deleting Submission...");
      await actions.submissions_deleteSubmission({
        submissionId: submission.id,
      });
      toast.dismiss();
      toast.success("Submission deleted successfully");
      window.location.reload();
    } catch (e: any) {
      toast.dismiss();
      toast.error("Failed to delete submission");
    }
  };

  return (
    <div className="overflow-x-scroll rounded-lg">
      <table className="w-full text-center text-black bg-white border-b">
        <thead className="sticky top-0 bg-secondary-300 text-secondary-700 border-b">
          <tr>
            <th className="sticky left-0 z-10 bg-secondary-300 px-2 py-1 text-xs font-medium uppercase text-secondary-700">
              username
            </th>
            <th className="sticky left-0 bg-secondary-300 px-2 py-1 text-xs font-medium uppercase text-secondary-700">
              name
            </th>
            <th scope="col" className="px-2 py-1 text-xs font-medium uppercase">
              Submission Date
            </th>
            <th scope="col" className="px-2 py-1 text-xs font-medium uppercase">
              Responsiveness (/10)
            </th>
            <th scope="col" className="px-2 py-1 text-xs font-medium uppercase">
              Styling (/10)
            </th>
            <th scope="col" className="px-2 py-1 text-xs font-medium uppercase">
              Others (/10)
            </th>
            <th scope="col" className="px-2 py-1 text-xs font-medium uppercase">
              Total
            </th>
            <th scope="col" className="px-2 py-1 text-xs font-medium uppercase">
              Feedback
            </th>
            {showActions && (
              <th scope="col" className="px-2 py-1 text-xs font-medium uppercase">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white text-xs">
          {
            <tr>
              <td className="sticky left-0 divide-gray-200 bg-white">
                {submission.enrolledUser.username}
              </td>
              <td className="">{submission.enrolledUser.user.name}</td>
              <td className="px-2 py-1">
                {day(submission.submissionDate).format("DD MMM YYYY hh:mm:ss A")}
              </td>
              <td className="whitespace-nowrap px-2 py-1">
                {isEditing ? (
                  <input
                    title="null"
                    type="number"
                    value={editedScores.responsiveness}
                    onChange={(e) => {
                      const newScore = parseInt(e.target.value);
                      if (!isNaN(newScore) && newScore >= 0 && newScore <= 10) {
                        setEditedScores((prevScores) => ({
                          ...prevScores,
                          responsiveness: newScore,
                        }));
                      }
                    }}
                    min={0}
                    max={10}
                    className="w-20 rounded-lg border-2 border-black bg-transparent px-2 text-background"
                  />
                ) : (
                  rValue?.score || "NA"
                )}
              </td>
              <td className="whitespace-nowrap px-2 py-1">
                {isEditing ? (
                  <input
                    title="null"
                    type="number"
                    value={editedScores.styling}
                    onChange={(e) => {
                      const newScore = parseInt(e.target.value);
                      if (!isNaN(newScore) && newScore >= 0 && newScore <= 10) {
                        setEditedScores((prevScores) => ({
                          ...prevScores,
                          styling: newScore,
                        }));
                      }
                    }}
                    min={0}
                    max={10}
                    className="w-20 rounded-lg border-2 border-black bg-transparent px-2 text-background"
                  />
                ) : (
                  sValue?.score || "NA"
                )}
              </td>
              <td className="whitespace-nowrap px-2 py-1">
                {isEditing ? (
                  <input
                    title="null"
                    type="number"
                    value={editedScores.other}
                    onChange={(e) => {
                      const newScore = parseInt(e.target.value);
                      if (!isNaN(newScore) && newScore >= 0 && newScore <= 10) {
                        setEditedScores((prevScores) => ({
                          ...prevScores,
                          other: newScore,
                        }));
                      }
                    }}
                    min={0}
                    max={10}
                    className="w-20 rounded-lg border-2 border-black bg-transparent px-2 text-background"
                  />
                ) : (
                  oValue?.score || "NA"
                )}
              </td>
              <td className="whitespace-nowrap px-2 py-1">
                {rValue?.score || sValue?.score || oValue?.score ? totalScore : "NA"}
              </td>
              <td>
                {isEditing ? (
                  <textarea
                    title="null"
                    value={feedback || ""}
                    onChange={(e) => {
                      setFeedback(e.target.value);
                    }}
                    className="m-2 block min-w-16 overflow-y-hidden rounded-lg border-2 border-black bg-transparent px-2 text-start text-background"
                  ></textarea>
                ) : (
                  submission.overallFeedback || "NA"
                )}
              </td>
              {showActions && (
                <td className="whitespace-nowrap px-2 py-1">
                  {isEditing ? (
                    <div className="flex items-center justify-center gap-5">
                      <button
                        onClick={handleSave}
                        className="font-semibold text-blue-600 hover:text-blue-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="font-semibold text-red-600 hover:text-red-700"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-5">
                      <button onClick={handleEdit} className="font-semibold text-blue-600">
                        Edit
                      </button>
                      <button
                        onClick={handleDelete}
                        className="font-semibold text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              )}
            </tr>
          }
        </tbody>
      </table>
    </div>
  );
};

export default EvaluateSubmission;
