import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import {
    trackHireApplicationSourceFixture,
  } from "./trackhire-application-source-fixture.js";
  
  describe(
    "TrackHire application source fixture",
    () => {
      it("installs the held-out Dart test at the expected path", () => {
        expect(
          trackHireApplicationSourceFixture.path,
        ).toBe(
          "test/factory_benchmark_application_source_test.dart",
        );
      });
  
      it("tests optional source behavior", () => {
        expect(
          trackHireApplicationSourceFixture.content,
        ).toContain(
          "application supports no source",
        );
  
        expect(
          trackHireApplicationSourceFixture.content,
        ).toContain(
          "missing API source remains valid",
        );
      });
  
      it("tests API serialization behavior", () => {
        expect(
          trackHireApplicationSourceFixture.content,
        ).toContain(
          "API serialization preserves source",
        );
  
        expect(
          trackHireApplicationSourceFixture.content,
        ).toContain(
          "API deserialization preserves source",
        );
      });
  
      it("tests database serialization behavior", () => {
        expect(
          trackHireApplicationSourceFixture.content,
        ).toContain(
          "database serialization preserves source",
        );
  
        expect(
          trackHireApplicationSourceFixture.content,
        ).toContain(
          "database deserialization preserves source",
        );
      });
  
      it("uses multiple source values to avoid a single hard-coded case", () => {
        expect(
          trackHireApplicationSourceFixture.content,
        ).toContain("LinkedIn");
  
        expect(
          trackHireApplicationSourceFixture.content,
        ).toContain("Referral");
  
        expect(
          trackHireApplicationSourceFixture.content,
        ).toContain(
          "Company Website",
        );
  
        expect(
          trackHireApplicationSourceFixture.content,
        ).toContain(
          "Career Fair",
        );
      });
    },
  );