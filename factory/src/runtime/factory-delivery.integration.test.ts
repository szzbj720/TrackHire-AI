import {
    afterEach,
    describe,
    expect,
    it,
    vi,
  } from "vitest";
  
  import {
    runFactoryDeliveryCli,
  } from "./factory-delivery-cli.js";
  
  describe(
    "TrackHire factory delivery integration",
    () => {
      afterEach(
        () => {
          vi.restoreAllMocks();
        },
      );
  
      it(
        "delivers a realistic TrackHire result through the complete dry-run CLI path",
        async () => {
          const output:
            string[] =
              [];
  
          vi.spyOn(
            console,
            "log",
          ).mockImplementation(
            (
              message?:
                unknown,
            ) => {
              output.push(
                String(
                  message,
                ),
              );
            },
          );
  
          await runFactoryDeliveryCli(
            [
              "src/runtime/fixtures/trackhire-final-result.json",
              "factory/TH-001",
              "feat:",
              "add",
              "TrackHire",
              "interview",
              "dates",
            ],
            {
              FACTORY_MODE:
                "dry-run",
  
              FACTORY_REPOSITORY:
                "szzbj720/TrackHire-AI",
  
              FACTORY_REPOSITORY_ROOT:
                process.cwd(),
  
              FACTORY_BASE_BRANCH:
                "main",
            },
          );
  
          expect(
            output,
          ).toHaveLength(1);
  
          const report =
            JSON.parse(
              output[0] ??
                "{}",
            ) as {
              taskId?: string;
              taskStatus?: string;
              stopReason?: string;
              executionMode?: string;
              validationPassed?: boolean;
              repairAttempts?: number;
              requiresHumanAction?: boolean;
              pullRequest?: {
                number?: number;
                url?: string;
                status?: string;
                isDraft?: boolean;
              };
            };
  
          expect(
            report.taskId,
          ).toBe(
            "TH-001",
          );
  
          expect(
            report.taskStatus,
          ).toBe(
            "AWAITING_FINAL_APPROVAL",
          );
  
          expect(
            report.stopReason,
          ).toBe(
            "FINAL_APPROVAL_REQUIRED",
          );
  
          expect(
            report.executionMode,
          ).toBe(
            "sequential",
          );
  
          expect(
            report.validationPassed,
          ).toBe(true);
  
          expect(
            report.requiresHumanAction,
          ).toBe(true);
  
          expect(
            report.pullRequest,
          ).toEqual({
            number:
              1,
  
            url:
              "https://github.com/szzbj720/TrackHire-AI/pull/1",
  
            status:
              "draft",
  
            isDraft:
              true,
          });
        },
      );
  
      it(
        "remains deterministic across independent dry-run executions",
        async () => {
          const output:
            string[] =
              [];
  
          vi.spyOn(
            console,
            "log",
          ).mockImplementation(
            (
              message?:
                unknown,
            ) => {
              output.push(
                String(
                  message,
                ),
              );
            },
          );
  
          const args = [
            "src/runtime/fixtures/trackhire-final-result.json",
            "factory/TH-001",
            "feat:",
            "add",
            "TrackHire",
            "interview",
            "dates",
          ];
  
          const environment = {
            FACTORY_MODE:
              "dry-run",
  
            FACTORY_REPOSITORY:
              "szzbj720/TrackHire-AI",
  
            FACTORY_REPOSITORY_ROOT:
              process.cwd(),
  
            FACTORY_BASE_BRANCH:
              "main",
          };
  
          await runFactoryDeliveryCli(
            args,
            environment,
          );
  
          await runFactoryDeliveryCli(
            args,
            environment,
          );
  
          expect(
            output,
          ).toHaveLength(2);
  
          const first =
            JSON.parse(
              output[0] ??
                "{}",
            );
  
          const second =
            JSON.parse(
              output[1] ??
                "{}",
            );
  
          expect(
            first,
          ).toEqual(
            second,
          );
  
          expect(
            first.pullRequest.number,
          ).toBe(1);
        },
      );
    },
  );