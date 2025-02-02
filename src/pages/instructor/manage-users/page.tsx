import UserPage from "./_components/UserPage"

function Page({allUsers,totalItems}:any) {
  return (
    <div>
        <UserPage data={allUsers} totalItems={totalItems} />
    </div>
  )
}

export default Page