import Link from "next/link";
import { StatusScreen } from "@/components/StatusScreen";

export default function NotFound() {
  return (
    <StatusScreen
      code="404"
      title="Page not found"
      message="The page you're looking for doesn't exist or may have moved."
      primary={
        <Link href="/dashboard" className="btn btn-primary">
          Go to dashboard
        </Link>
      }
    />
  );
}
