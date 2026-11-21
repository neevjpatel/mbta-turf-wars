import Link from "next/link";

export default function ProfilePage() {
  return <main className="utility-page profile-page"><span className="large-avatar">KS</span><p className="eyebrow">Guest rider</p><h1>Profile service is not connected.</h1><p className="utility-intro">This repository does not contain an authentication or persistent profile backend. The route is preserved as a recoverable station instead of inventing account functionality.</p><Link className="primary-action" href="/?station=turf">Return Home</Link></main>;
}
