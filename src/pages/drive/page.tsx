import Providers from "@/utils/providers";

import Drive from "./_components/Drive";

function Page({ uploadedFiles }: any) {
  return (
    <Providers>
      <Drive uploadedFiles={uploadedFiles} />
    </Providers>
  );
}

export default Page;
