# 98_ARCHITECT_GUARDRAILS.md

# 架构铁律 / Architect Guardrails

本文件是项目最高优先级架构约束之一。

任何代码、类型、目录、Importer、Generator、Validator、RiskEngine 的实现，都不得违反本文件。

优先级顺序：

1. docs/00_PROJECT_PRINCIPLES.md
2. docs/98_ARCHITECT_GUARDRAILS.md
3. docs/99_CODEX_RULES.md
4. docs/01_ARCHITECTURE.md
5. docs/02_VALIDATION_STANDARD.md
6. 其他实现文件

---

## 1. Country 是环境生成根节点

Country 是 Locale 生成的根节点。

禁止随机拼接：

* country
* language
* timezone
* keyboard
* fontSet
* currency

正确流程：

IP / 输入参数
↓
Country
↓
Locale
↓
Timezone
↓
Keyboard
↓
Fonts

错误示例：

US + de-DE + Asia/Tokyo

这种组合必须被 Validator 拒绝。

---

## 2. Persona 禁止持久化

Persona 不是数据库实体。

Persona 只能是运行时生成结果。

允许存在：

* database/country/
* database/locale/
* database/timezone/
* database/fonts/
* database/os/
* database/hardware/
* database/browser/

禁止存在：

* database/persona/
* persona samples
* persona templates
* 预生成 persona 池

RuntimePersona 只能由 Generator 在运行时生成。

---

## 3. Generator 必须可复现

Generator 必须支持 seed。

同一个：

* seed
* ruleVersion
* input
* database version

必须生成相同结果。

禁止直接使用：

* Math.random()
* Date.now()
* 当前系统时间
* 不可控随机源

如果需要随机，必须通过 SeededRandom 或 WeightEngine。

---

## 4. 所有规则必须配置化

禁止在代码里硬编码国家、语言、时区、字体、硬件、浏览器规则。

禁止示例：

if (country === "US") {
return "en-US"
}

正确方式：

从 database 中读取配置，再通过 RuleEngine / WeightEngine 处理。

---

## 5. Importer 只能转换数据，不能创造数据含义

Importer 的职责：

* 读取 raw-data
* 解析 txt
* 清洗字段
* 标准化格式
* 输出 database JSON
* 生成 ImportReport

Importer 禁止：

* 推断缺失国家规则
* 自动补全未知语言
* 猜测 timezone
* 生成 RuntimePersona
* 执行 Generator 逻辑
* 执行 RiskEngine 逻辑

如果数据无法解析：

必须写入 warnings 或 errors。

不得静默丢弃。

---

## 6. Generator / Validator / RiskEngine 必须分离

Generator 只负责生成候选结果。

Validator 只负责验证一致性。

RiskEngine 只负责风险评分与原因说明。

禁止：

* Generator 内部偷偷修复数据
* Validator 内部生成数据
* RiskEngine 内部修改 Persona
* 一个模块同时承担多个职责

---

## 7. 硬件规则独立于国家规则

Country 与 Hardware 是两个独立维度。

禁止把 CPU / GPU / RAM 写入 CountryProfile。

错误示例：

{
"country": "DE",
"cpu": "i7-12700"
}

正确方式：

CountryEngine 负责地区与 Locale。

HardwareEngine 负责 CPU / GPU / RAM / OS。

PersonaGenerator 只在最终阶段组合它们。

---

## 8. 数据库必须支持版本化

所有 database 输出必须带版本信息。

RuntimePersona 必须记录：

* ruleVersion
* databaseVersion
* generatedAt
* seed

Importer 输出必须记录：

* importedAt
* sourceFiles
* totalRecords
* validRecords
* invalidRecords
* warnings
* errors

未来规则升级时，必须能追溯旧 Persona 来自哪一版规则。

---

## 9. 所有生成结果必须可解释

任何 RuntimePersona 都必须能回答：

* 为什么选择这个 country？
* 为什么选择这个 language？
* 为什么选择这个 timezone？
* 为什么选择这个 fontSet？
* 为什么选择这个 hardware？
* 为什么 validation 通过或失败？
* 为什么 riskScore 是这个数？

因此所有关键字段必须保留：

* source
* confidence
* weight
* ruleVersion
* reasons

---

## 10. RiskAssessment 必须包含原因

RiskAssessment 禁止只有 score。

必须包含：

* score
* level
* reasons

示例：

{
"score": 72,
"level": "high",
"reasons": [
"timezone_not_match_country",
"gpu_too_high_for_cpu"
]
}

---

## 11. ValidationResult 禁止只有 boolean

禁止：

{
"passed": true
}

必须包含：

* passed
* errors
* warnings
* score
* checkedAt

---

## 12. 阶段顺序不可跳过

项目阶段必须按以下顺序推进：

Phase 1：目录结构与架构文档

Phase 1.5：TypeScript 类型审查

Phase 2：Raw Data Importer

Phase 3：Database Validation

Phase 4：Generator

Phase 5：Validator

Phase 6：RiskEngine

Phase 7：Integration Test

未经用户确认，不得进入下一阶段。

---

## 13. raw-data 与 database 必须隔离

raw-data 是原始输入。

database 是标准化输出。

Generator、Validator、RiskEngine 禁止直接读取 raw-data。

只有 Importer 可以读取 raw-data。

---

## 14. 不允许创建垃圾目录

禁止创建以下模糊目录：

* utils/
* helpers/
* common/
* misc/
* temp/

除非用户明确批准。

新增目录必须说明职责边界。

---

## 15. 安全边界

本项目仅用于：

* 合法测试环境
* 自动化兼容性验证
* 环境一致性检查
* 数据规则验证
* 内部质量控制

禁止实现、描述或命名为：

* 绕过风控
* 规避检测
* 反检测
* 平台对抗
* 账号滥用
* 欺骗安全系统

任何相关需求必须改写为合法测试、兼容性验证或环境一致性检查语义。

---

## 16. 总结原则

真实性优先于随机性。

规则优先于样本。

可解释性优先于数量。

可复现性优先于速度。

验证优先于生成。

架构边界优先于短期方便。
