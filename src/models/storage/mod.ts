import { music } from "./music/mod";

type Version = "1";

export const storage = {
  music,
  migrateIfNeeded() {
    let version = localStorage.getItem("version") as Version | null;

    if (version == null) {
      localStorage.setItem("version", "1");
      version = "1";
    }

    // Using fallthrough. Only the latest version of the case clause contains `break;`.
    switch (version) {
      case "1": {
        break;
      }
      default:
        throw new Error(version satisfies never);
    }
  },
};
