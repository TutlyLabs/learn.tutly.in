import NoDataFound from "@/components/NoDataFound";
import Providers from "@/utils/providers";

function Page({ firstCourseId }: any) {
  return (
    <Providers>
      {!firstCourseId && <NoDataFound message="Oops! No enrolled courses found" />}
    </Providers>
  );
}

export default Page;
