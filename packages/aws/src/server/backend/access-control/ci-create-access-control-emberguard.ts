import { Emberguard } from "@cloudigniter/emberguard";
import {
  ciCreateAwsEmberguardProvider,
  type CiAwsEmberguardDatabase,
} from "@cloudigniter/emberguard/providers/aws";
import {
  CI_DEFAULT_ACCESS_CONTROL_DEFINITION,
  ciBuildTableKey,
  ciBuildTableKeys,
} from "@cloudigniter/core/lib";

/** Creates the AWS-backed EmberGuard instance used by handlers and bootstrap. */
export function ciCreateAccessControlEmberguard(input: {
  database: CiAwsEmberguardDatabase;
  accessControlTableName: string;
}): Emberguard {
  return new Emberguard(
    ciCreateAwsEmberguardProvider({
      database: input.database,
      tables: { accessTableName: input.accessControlTableName },
      keys: {
        accessControlDefinition: ciBuildTableKeys({
          partition: ["EMBERGUARD", "ACCESS_CONTROL"],
          sort: ["DEFINITION", "ACTIVE"],
        }),
        roleAssignment: (assignment) => ({
          record: ciBuildTableKeys({
            partition: [
              "EMBERGUARD",
              "SUBJECT",
              assignment.subjectId,
              "ROLE_ASSIGNMENTS",
            ],
            sort: ["ROLE_ASSIGNMENT", assignment.id],
          }),
          collection: ciBuildTableKeys({
            partition: ["EMBERGUARD", "ROLE_ASSIGNMENTS"],
            sort: [
              "TENANT",
              assignment.tenantId ?? "global",
              "SUBJECT",
              assignment.subjectId,
              "ROLE_ASSIGNMENT",
              assignment.id,
            ],
          }),
        }),
        roleAssignmentsBySubject: (subjectId) =>
          ciBuildTableKeys({
            partition: ["EMBERGUARD", "SUBJECT", subjectId, "ROLE_ASSIGNMENTS"],
            sort: ["COLLECTION"],
          }).PK,
        roleAssignmentsCollection: ciBuildTableKey(
          "EMBERGUARD",
          "ROLE_ASSIGNMENTS"
        ),
        roleAssignmentsByTenant: (tenantId) =>
          ciBuildTableKey("TENANT", tenantId),
      },
    }),
    { definition: CI_DEFAULT_ACCESS_CONTROL_DEFINITION }
  );
}
