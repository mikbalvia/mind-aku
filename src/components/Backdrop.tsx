export function Backdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <div className="backdrop__blob backdrop__blob--a" />
      <div className="backdrop__blob backdrop__blob--b" />
      <div className="backdrop__blob backdrop__blob--c" />
      <div className="backdrop__ring" />
      <div className="backdrop__ring--inner" />
      <div className="backdrop__grain" />
      <div className="backdrop__vignette" />
    </div>
  );
}