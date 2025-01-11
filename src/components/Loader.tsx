import { Suspense } from "react";

const Loader = () => {
  return (
    <Suspense>
      <div className="flex h-screen w-full items-center justify-center">
        <div className="loader"></div>
      </div>
    </Suspense>
  );
};

export default Loader;
