import Dashboard from './_components/dashboard'

function Page({dashboardData,name,currentUser}:any) {
  return (
    <div>
        <Dashboard data={dashboardData} name={name} currentUser={currentUser} />
    </div>
  )
}

export default Page