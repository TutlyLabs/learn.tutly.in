'use client'
import ManagePassword from "@/pages/profile/_components/ManagePassword";


const page = ({
    email
    }: {
    email: string
}) => {
  return (
    <div>
        <ManagePassword  initialEmail={email} />
    </div>
  )
}

export default page