import Providers from "@/utils/providers"
import { Calendar } from "./_components/calendar";
import { EventsSidebar } from "./_components/events";
import { format } from "date-fns";

const Schedule = ({courses,isAuthorized, holidays}:any) => {
const assignments = courses.flatMap((course:any) =>
    course.classes.flatMap((classItem:any) =>
      classItem.attachments.map((attachment:any) => {
        const createdAtDate = new Date(attachment.createdAt);
        const startDate = new Date(createdAtDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(createdAtDate);
        endDate.setHours(23, 59, 59, 999);
  
        return {
          type: "Assignment",
          name: attachment.title,
          description: `Assignment added on ${format(new Date(attachment.createdAt), "MMMM d, yyyy, EEEE, h:mm a")}`,
          startDate,
          endDate,
          link: `assignments/${attachment.id}`,
        };
      })
    )
  );
  
  const classEvents = courses.flatMap((course:any) =>
    course.classes.map((classItem:any) => ({
      type: "Class",
      name: classItem.title,
      description: `Session starts at ${format(new Date(classItem.createdAt), "MMMM d, yyyy, EEEE, h:mm a")}`,
      startDate: new Date(classItem.createdAt),
      endDate: new Date(classItem.createdAt.getTime() + 2000 * 60 * 60),
      link: `courses/${course.id}/classes/${classItem.id}`,
    }))
  );
  
  const holidayEvents = holidays.map((holiday:any) => {
    const startDate = new Date(holiday.startDate);
    const endDate = new Date(holiday.endDate);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
  
    return {
      type: "Holiday",
      name: holiday.reason,
      description: holiday?.description || "Observed holiday",
      startDate: startDate,
      endDate: endDate,
      link: "/schedule",
    };
  });
  
  const events = [...assignments, ...classEvents, ...holidayEvents];
  return (
    <Providers>
        <div className="bg-background h-full">
            <div className="md:flex gap-2">
                <div className="md:fixed">
                    <EventsSidebar events={events}/>
                </div>
                <div className="md:ml-[270px] md:flex-1">
                    <Calendar events={events} isAuthorized={isAuthorized} holidays={holidays}/>
                </div>
            </div>
        </div>
    </Providers>
  )
}

export default Schedule