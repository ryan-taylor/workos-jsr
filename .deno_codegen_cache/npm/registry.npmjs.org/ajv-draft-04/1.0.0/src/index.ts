import type { AnySchemaObject, Options } from "ajv/dist/core";
import AjvCore from "ajv/dist/core";
import draft4Vocabularies from "./vocabulary/draft4";
import discriminator from "ajv/dist/vocabularies/discriminator";
import * as draft4MetaSchema from "./refs/json-schema-draft-04.json";

const META_SUPPORT_DATA = ["/properties"];

const META_SCHEMA_ID = "http://json-schema.org/draft-04/schema";

class Ajv extends AjvCore {
  constructor(opts: Options = {}) {
    super({
      ...opts,
      schemaId: "id",
    });
  }

  _addVocabularies(): void {
    super._addVocabularies();
    draft4Vocabularies.forEach((v) => this.addVocabulary(v));
    if (this.opts.discriminator) this.addKeyword(discriminator);
  }

  _addDefaultMetaSchema(): void {
    super._addDefaultMetaSchema();
    if (!this.opts.meta) return;
    const metaSchema = this.opts.$data
      ? this.$dataMetaSchema(draft4MetaSchema, META_SUPPORT_DATA)
      : draft4MetaSchema;
    this.addMetaSchema(metaSchema, META_SCHEMA_ID, false);
    this.refs["http://json-schema.org/schema"] = META_SCHEMA_ID;
  }

  defaultMeta(): string | AnySchemaObject | undefined {
    return (this.opts.defaultMeta = super.defaultMeta() ||
      (this.getSchema(META_SCHEMA_ID) ? META_SCHEMA_ID : undefined));
  }
}

module.exports = exports = Ajv;
Object.defineProperty(exports, "__esModule", { value: true });

export default Ajv;

export {
  AnySchema,
  AnySchemaObject,
  AsyncFormatDefinition,
  AsyncSchema,
  AsyncValidateFunction,
  CodeKeywordDefinition,
  ErrorNoParams,
  ErrorObject,
  Format,
  FormatDefinition,
  FuncKeywordDefinition,
  KeywordDefinition,
  KeywordErrorDefinition,
  MacroKeywordDefinition,
  Schema,
  SchemaObject,
  SchemaValidateFunction,
  ValidateFunction,
  Vocabulary,
} from "ajv/dist/types";

export {
  CodeOptions,
  ErrorsTextOptions,
  InstanceOptions,
  Logger,
  Options,
  Plugin,
} from "ajv/dist/core";
export { SchemaCxt, SchemaObjCxt } from "ajv/dist/core";
export { KeywordCxt } from "ajv/dist/core";
export { DefinedError } from "ajv/dist/core";
export { JSONType } from "ajv/dist/core";
export { JSONSchemaType } from "ajv/dist/core";
export {
  _,
  Code,
  CodeGen,
  CodeGenOptions,
  Name,
  nil,
  str,
  stringify,
} from "ajv/dist/core";
