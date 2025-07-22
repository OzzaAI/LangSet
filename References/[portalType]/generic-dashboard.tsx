export default function GenericDashboard({ portalType }: { portalType: string }) {
  return (
    <section className="flex flex-col items-start justify-start p-6 w-full">
      <div className="w-full">
        <div className="flex flex-col items-start justify-center gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            {portalType.charAt(0).toUpperCase() + portalType.slice(1)} Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome to the {portalType} portal.
          </p>
        </div>
      </div>
    </section>
  );
}