'use  client';
import ReactPlayground from "./ReactPlayground";


const page = ({
  currentUser
}:{
  currentUser: any
}) => {
  return (
    <div>
      <ReactPlayground currentUser={currentUser}  />
    </div>
  )
}

export default page