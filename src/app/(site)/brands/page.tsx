import { CmsPage, cmsMetadata } from "@/components/site/CmsPage";

export const generateMetadata = () => cmsMetadata("brands");

export default function BrandsPage() {
  return <CmsPage slug="brands" />;
}
