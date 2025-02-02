"use client";

import Providers from "@/utils/providers";

const page = ({ notifcationlink }: { notifcationlink: string }) => {
  return (
    <Providers>
      <div className="flex h-screen flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold">Redirecting...</h1>
          <p className="text-xl">
            If you are not redirected automatically, please click
            <a href={String(notifcationlink)}>here</a>.
          </p>
        </div>
      </div>
    </Providers>
  );
};

export default page;
