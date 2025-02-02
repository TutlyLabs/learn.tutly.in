import Drive from './_components/Drive'

function Page({uploadedFiles}:any) {
  return (
    <div><Drive uploadedFiles={uploadedFiles} /></div>
  )
}

export default Page