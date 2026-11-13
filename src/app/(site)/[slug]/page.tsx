import { CmsPage, cmsMetadata } from "@/components/site/CmsPage";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  return cmsMetadata((await params).slug);
}

export default async function Page({ params }: Props) {
  return <CmsPage slug={(await params).slug} />;
}
