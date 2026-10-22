import { Page, Card } from "@/components/ui";

export default function Waiting() {
  return (
    <Page title="Not started yet">
      <Card>
        The program lead has not published the Notice. Until the Notice is published, the Gap Reader reads nothing and runs nothing. You will be asked to read it before you take any survey or appear in any report.
      </Card>
    </Page>
  );
}
