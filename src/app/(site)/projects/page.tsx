import { CmsPage, cmsMetadata } from "@/components/site/CmsPage";

export const generateMetadata = () => cmsMetadata("projects");

export default function ProjectsPage() {
  return <CmsPage slug="projects" />;
}
