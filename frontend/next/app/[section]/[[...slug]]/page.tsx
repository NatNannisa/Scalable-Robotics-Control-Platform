import SpaceDashboard from "@/src/components/SpaceDashboard";

export default function RoutedDashboard({ params }: { params: { section: string; slug?: string[] } }) {
  const path = `/${[params.section, ...(params.slug ?? [])].join("/")}`;
  return <SpaceDashboard path={path} />;
}
