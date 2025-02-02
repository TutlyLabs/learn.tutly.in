"use  client";

import Providers from "@/utils/providers";

import ReactPlayground from "./ReactPlayground";

const page = ({ currentUser }: { currentUser: any }) => {
  return (
    <Providers>
      <ReactPlayground currentUser={currentUser} />
    </Providers>
  );
};

export default page;
