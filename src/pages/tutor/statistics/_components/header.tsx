import React, { useEffect } from "react";
import { SelectMentor } from "./selectMentor";
import { SelectStudent } from "./selectStudent";

function Header({ mentors, mentees, currentUser, data, courseId }: any) {
  const [mentorName, setMentorName] = React.useState<string>("");
  const [menteeName, setMenteeName] = React.useState<string>("");

  React.useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const mentorFromParams = searchParams.get("mentor") || "";
    const menteeFromParams = searchParams.get("student") || "";
    setMentorName(mentorFromParams);
    setMenteeName(menteeFromParams);
  }, []);
  

  // Sync state with URL search parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (mentorName) searchParams.set("mentor", mentorName);
    else searchParams.delete("mentor");

    if (menteeName) searchParams.set("student", menteeName);
    else searchParams.delete("student");

    const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
    window.history.replaceState(null, "", newUrl);
  }, [mentorName, menteeName]);

  return (
    <div className="flex justify-between mx-4 md:mx-8">
      <div className="flex gap-2 items-center">
        {data?.data?.map((course) => (
          <a
            href={`/tutor/statistics/${course.id}`}
            className={`p-1 px-2 border rounded-lg ${course.id === courseId ? "border-primary" : ""}`}
            key={course.id}
          >
            {course.title}
          </a>
        ))}
      </div>
      <div className="flex gap-2 items-center">
        {currentUser?.role === "INSTRUCTOR" && (
          <SelectMentor
            mentors={mentors}
            mentorName={mentorName}
            setMentorName={setMentorName}
          />
        )}
        <SelectStudent
          mentees={mentees}
          menteeName={menteeName}
          setMenteeName={setMenteeName}
        />
      </div>
    </div>
  );
}

export default Header;
