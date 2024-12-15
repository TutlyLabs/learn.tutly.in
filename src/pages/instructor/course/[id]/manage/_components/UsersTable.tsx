import { actions } from "astro:actions";
import { useState } from "react";
import toast from "react-hot-toast";
import { FaSort, FaSortAlphaDown, FaSortAlphaDownAlt, FaUserPlus } from "react-icons/fa";
import { FaUserXmark } from "react-icons/fa6";
import { MdOutlineBlock } from "react-icons/md";
import { RiGlobalLine } from "react-icons/ri";
import { TbUserOff } from "react-icons/tb";
import { TbUserSearch } from "react-icons/tb";

import { useRouter } from "@/hooks/use-router";

const UserTable = ({ users, params }: { users: Array<any>; params: any }) => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [showAllUsers, setShowAllUsers] = useState(true);
  const [searchBar, setSearchBar] = useState("");
  const roles = ["STUDENT", "MENTOR"];
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [sortColumn, setSortColumn] = useState<string>("");

  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(searchBar.trim().toLowerCase())
  );

  const displayedUsers = showAllUsers
    ? filteredUsers
    : filteredUsers.filter((user) => user.enrolledUsers.length === 0);

  const mentors = users.filter(
    (user) =>
      user.role === "MENTOR" &&
      user.enrolledUsers.find(({ course }: { course: any }) => course.id === params.id) !==
        undefined
  );

  const handleEnroll = async (username: string) => {
    toast.loading("Enrolling user...");
    try {
      setLoading(true);

      const { error } = await actions.courses_enrollStudentToCourse({
        courseId: params.id,
        username,
      });

      if (error) {
        toast.dismiss();
        toast.error(error.message);
        setLoading(false);
        return;
      }

      toast.dismiss();
      toast.success(`${username} enrolled successfully`);
      router.push(router.pathname);
      setLoading(false);
    } catch (err: any) {
      router.push(router.pathname);
      setLoading(false);
      toast.dismiss();
      toast.error(err.response.data.error);
    }
  };

  const handleUnenroll = async (username: string) => {
    toast.loading("Unenrolling user...");
    try {
      setLoading(true);

      const { error } = await actions.courses_unenrollStudentFromCourse({
        courseId: params.id,
        username,
      });

      if (error) {
        toast.dismiss();
        toast.error(error.message);
        setLoading(false);
        return;
      }
      toast.dismiss();
      toast.success(`${username} unenrolled successfully`);
      setLoading(false);
      router.push(router.pathname);
    } catch (err: any) {
      setLoading(false);
      toast.dismiss();
      toast.error(err.response.data.error);
    }
  };

  const handleRoleChange = async (username: string, role: string) => {
    toast.loading("Updating user role...");
    try {
      setLoading(true);

      const { error } = await actions.courses_updateRole({
        username,
        role: role as "STUDENT" | "MENTOR",
      });

      if (error) {
        toast.dismiss();
        toast.error(error.message);
        setLoading(false);
        return;
      }
      toast.dismiss();
      toast.success(`User role updated to ${role}`);
      setLoading(false);
      router.push(router.pathname);
    } catch (err: any) {
      setLoading(false);
      toast.dismiss();
      toast.error(err.response.data.error);
    }
  };

  const handleMentorChange = async (username: string, mentorUsername: string) => {
    toast.loading("Updating mentor...");
    try {
      setLoading(true);

      await actions.courses_updateMentor({ courseId: params.id, username, mentorUsername });

      toast.dismiss();
      toast.success(`Mentor updated successfully`);
      setLoading(false);
      router.push(router.pathname);
    } catch (err: any) {
      setLoading(false);
      toast.dismiss();
      toast.error(err.response.data.error);
    }
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortOrder("asc");
    }
  };

  const getSortedUsers = () => {
    const sortedUsers = [...displayedUsers];
    sortedUsers.sort((a, b) => {
      if (sortColumn) {
        if (a[sortColumn] < b[sortColumn]) {
          return sortOrder === "asc" ? -1 : 1;
        }
        if (a[sortColumn] > b[sortColumn]) {
          return sortOrder === "asc" ? 1 : -1;
        }
      }
      return 0;
    });
    return sortedUsers;
  };

  const sortedUsers = getSortedUsers();
  return (
    <div className="mb-8 max-w-full overflow-x-auto">
      <div className="mb-4 flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-x-4 md:space-y-0">
        <div className="relative w-full max-sm:px-3 md:w-auto">
          <input
            type="text"
            placeholder="Search by username..."
            value={searchBar}
            onChange={(e) => setSearchBar(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
          />
          <TbUserSearch className="absolute right-4 top-2 h-5 w-5" />
        </div>

        <div className="flex flex-col items-start space-y-2 max-sm:ms-3 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
          <label className="flex cursor-pointer items-center">
            <input
              type="radio"
              name="userFilter"
              checked={showAllUsers}
              onChange={() => setShowAllUsers(true)}
              className="mr-2"
            />
            All <RiGlobalLine className="ml-1 h-5 w-5" />
          </label>
          <label className="flex cursor-pointer items-center">
            <input
              type="radio"
              name="userFilter"
              checked={!showAllUsers}
              onChange={() => setShowAllUsers(false)}
              className="mr-2"
            />
            Not Enrolled <TbUserOff className="ml-1 h-5 w-5" />
          </label>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] border-collapse border border-gray-300">
          <thead>
            <tr className="bg-sky-800">
              <th className="border border-gray-300 px-2 py-2 text-sm">S.No</th>
              <th className="border border-gray-300 px-2 py-2 text-sm">
                <div className="flex items-center justify-center max-sm:px-10">
                  Username &nbsp;
                  {sortColumn !== "username" && (
                    <FaSort onClick={() => handleSort("username")} className="cursor-pointer" />
                  )}
                  {sortColumn === "username" && sortOrder === "desc" && (
                    <FaSortAlphaDownAlt
                      onClick={() => handleSort("username")}
                      className="h-4 w-4 cursor-pointer"
                    />
                  )}
                  {sortColumn === "username" && sortOrder === "asc" && (
                    <FaSortAlphaDown
                      onClick={() => handleSort("username")}
                      className="h-4 w-4 cursor-pointer"
                    />
                  )}
                </div>
              </th>
              <th className="border border-gray-300 px-2 py-2 text-sm">Name</th>
              <th className="border border-gray-300 px-2 py-2 text-sm">
                <div className="flex items-center justify-center">
                  Role &nbsp;
                  {sortColumn !== "role" && (
                    <FaSort onClick={() => handleSort("role")} className="cursor-pointer" />
                  )}
                  {sortColumn === "role" && sortOrder === "desc" && (
                    <FaSortAlphaDownAlt
                      onClick={() => handleSort("role")}
                      className="h-4 w-4 cursor-pointer"
                    />
                  )}
                  {sortColumn === "role" && sortOrder === "asc" && (
                    <FaSortAlphaDown
                      onClick={() => handleSort("role")}
                      className="h-4 w-4 cursor-pointer"
                    />
                  )}
                </div>
              </th>
              <th className="border border-gray-300 px-2 py-2 text-sm">Email</th>
              <th className="border border-gray-300 px-2 py-2 text-sm">Mentor</th>
              <th className="border border-gray-300 px-2 py-2 text-sm">Action</th>
            </tr>
          </thead>
          <tbody>
            {sortedUsers.length === 0 && (
              <tr>
                <td colSpan={7} className="py-4 text-center text-xl">
                  <div className="flex items-center justify-center px-4">
                    No users found <MdOutlineBlock className="ml-2 h-8 w-8" />
                  </div>
                </td>
              </tr>
            )}
            {sortedUsers.map((user, index) => (
              <tr key={user.id} className="hover:bg-slate-600">
                <td className="border border-gray-300 px-2 py-2 text-sm">{index + 1}</td>
                <td className="border border-gray-300 px-2 py-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <img
                      loading="lazy"
                      src={user.image || "/placeholder.jpg"}
                      alt="user"
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full"
                    />
                    <span>{user.username}</span>
                  </div>
                </td>
                <td className="border border-gray-300 px-2 py-2 text-sm">{user.name}</td>
                <td className="border border-gray-300 px-2 py-2 text-center text-sm">
                  {user.role !== "INSTRUCTOR" ? (
                    <select
                      title="role"
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.username, e.target.value)}
                      className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none bg-zinc-700"
                    >
                      {roles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="disabled cursor-not-allowed select-none rounded-md bg-zinc-700 px-2 py-1 text-sm font-semibold ">
                      {user.role}
                    </span>
                  )}
                </td>
                <td className="border border-gray-300 px-2 py-2 text-sm">{user.email}</td>
                <td className="border border-gray-300 px-2 py-2 text-sm">
                  {user.role === "STUDENT" &&
                  user.enrolledUsers.find(
                    ({ course }: { course: any }) => course.id === params.id
                  ) !== undefined ? (
                    <select
                      title="role"
                      value={user.mentor}
                      onChange={(e) => handleMentorChange(user.username, e.target.value)}
                      className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none bg-zinc-700"
                    >
                      <option value="">None</option>
                      {mentors.map((mentor) => (
                        <option
                          key={mentor.id}
                          value={mentor.username}
                          selected={
                            mentor.username ===
                            user.enrolledUsers.find(
                              ({ course }: { course: any }) => course.id === params.id
                            )?.mentorUsername
                          }
                        >
                          {mentor.username}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="disabled cursor-not-allowed select-none rounded-md bg-zinc-700 px-2 py-1 text-sm font-semibold text-white">
                      None
                    </span>
                  )}
                </td>
                <td className="border border-gray-300 px-2 py-2 text-sm">
                  {user.enrolledUsers.find(
                    ({ course }: { course: any }) => course.id === params.id
                  ) === undefined ? (
                    <button
                      disabled={loading}
                      onClick={() => handleEnroll(user.username)}
                      className="flex select-none items-center justify-center rounded-full bg-emerald-700 px-2 py-1 text-sm text-white hover:bg-emerald-800 focus:bg-emerald-800 focus:outline-none"
                    >
                      Enroll <FaUserPlus className="ml-1 h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      disabled={loading}
                      onClick={() => handleUnenroll(user.username)}
                      className="flex select-none items-center justify-center rounded-full bg-red-800 px-2 py-1 text-sm text-white hover:bg-red-700 focus:bg-red-800 focus:outline-none"
                    >
                      Unenroll <FaUserXmark className="ml-1 h-4 w-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserTable;
