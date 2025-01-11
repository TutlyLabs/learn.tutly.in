const NoDataFound = ({ message = "No data found" }: { message?: string }) => {
  return (
    <div>
      <p className="mt-5 text-center text-3xl font-bold">Oops! {message}</p>
      <img
        src="/notify_nodatafound.svg"
        height={400}
        className="mx-auto mt-8"
        width={400}
        alt={message}
      />
    </div>
  );
};

export default NoDataFound;
