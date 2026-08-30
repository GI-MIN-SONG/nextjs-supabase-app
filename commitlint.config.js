module.exports = {
  extends: ["@commitlint/config-conventional"],
  // "✨ feat: 설명" 형식(/git:commit 스킬이 생성하는 이모지 접두사 커밋)을 파싱하기 위해
  // type 앞에 오는 이모지+공백을 옵셔널로 허용하는 헤더 패턴을 사용한다.
  parserPreset: {
    parserOpts: {
      headerPattern: /^(?:\S+\s+)?(\w*)(?:\(([\w$.\-*/ ]*)\))?: (.*)$/,
      headerCorrespondence: ["type", "scope", "subject"],
    },
  },
  rules: {
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "docs", "style", "refactor", "perf", "test", "chore"],
    ],
  },
};
