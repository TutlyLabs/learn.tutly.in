const DriveEmbed = ({ embedId }: { embedId: string }) => (
  <div className="">
    <iframe
      src={`https://drive.google.com/file/d/${embedId}/preview`}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      title="Embedded Drive"
      className="aspect-video w-full"
    />
  </div>
);

export default DriveEmbed;
