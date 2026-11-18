import { SerajLoader } from "@/components/SerajLoader";

/*
 * Only the home page and the brand/project lists sit under this loader. Detail pages
 * (/[slug], /brands/[slug], /projects/[slug]) stay outside it on purpose: a loading boundary
 * makes Next send "200" before the page knows whether it exists, so an unknown slug would
 * answer 200 instead of a real 404.
 */
export default function Loading() {
  return <SerajLoader />;
}
