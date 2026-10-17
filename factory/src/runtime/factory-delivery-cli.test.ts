import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import {
    parseFactoryDeliveryArguments,
    parseFactoryRuntimeMode,
  } from "./factory-delivery-cli.js";
  
  describe(
    "factory delivery CLI",
    () => {
      describe(
        "parseFactoryDeliveryArguments",
        () => {
          it(
            "parses the result file, branch, and PR title",
            () => {
              const input =
                parseFactoryDeliveryArguments([
                  "./result.json",
                  "factory/TH-001",
                  "feat:",
                  "add",
                  "interview",
                  "date",
                ]);
  
              expect(
                input,
              ).toEqual({
                resultFile:
                  "./result.json",
  
                headBranch:
                  "factory/TH-001",
  
                pullRequestTitle:
                  "feat: add interview date",
              });
            },
          );
  
          it(
            "rejects a missing result file",
            () => {
              expect(() =>
                parseFactoryDeliveryArguments(
                  [],
                ),
              ).toThrow(
                "Factory result file is required.",
              );
            },
          );
  
          it(
            "rejects a missing head branch",
            () => {
              expect(() =>
                parseFactoryDeliveryArguments([
                  "./result.json",
                ]),
              ).toThrow(
                "Factory head branch is required.",
              );
            },
          );
  
          it(
            "rejects a missing pull request title",
            () => {
              expect(() =>
                parseFactoryDeliveryArguments([
                  "./result.json",
                  "factory/TH-001",
                ]),
              ).toThrow(
                "Factory pull request title is required.",
              );
            },
          );
        },
      );
  
      describe(
        "parseFactoryRuntimeMode",
        () => {
          it(
            "defaults to dry-run mode",
            () => {
              expect(
                parseFactoryRuntimeMode(
                  undefined,
                ),
              ).toBe(
                "dry-run",
              );
            },
          );
  
          it(
            "accepts dry-run mode",
            () => {
              expect(
                parseFactoryRuntimeMode(
                  "dry-run",
                ),
              ).toBe(
                "dry-run",
              );
            },
          );
  
          it(
            "accepts live mode",
            () => {
              expect(
                parseFactoryRuntimeMode(
                  "live",
                ),
              ).toBe(
                "live",
              );
            },
          );
  
          it(
            "rejects unsupported modes",
            () => {
              expect(() =>
                parseFactoryRuntimeMode(
                  "unsafe",
                ),
              ).toThrow(
                "Unsupported FACTORY_MODE: unsafe",
              );
            },
          );
        },
      );
    },
  );