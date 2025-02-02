import UserCards from './_components/UserCards'

function Page({users,totalCount,activeCount,limit}:any) {
  return (
    <div>
        <UserCards
            users={users}
            totalItems={totalCount}
            activeCount={activeCount}
            defaultPageSize={limit}
        />
    </div>
  )
}

export default Page