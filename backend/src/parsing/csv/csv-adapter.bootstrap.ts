import { Injectable, OnModuleInit } from "@nestjs/common";
import { CsvAdapterRegistry } from "./csv-adapter.registry";
import { CibcCsvAdapter } from "./cibc.adapter";
import { RbcCsvAdapter } from "./rbc.adapter";
import { TdCsvAdapter } from "./td.adapter";
import { BmoCsvAdapter } from "./bmo.adapter";

@Injectable()
export class CsvAdapterBootstrap implements OnModuleInit {
  constructor(
    private readonly registry: CsvAdapterRegistry,
    private readonly cibc: CibcCsvAdapter,
    private readonly rbc: RbcCsvAdapter,
    private readonly td: TdCsvAdapter,
    private readonly bmo: BmoCsvAdapter
  ) {}

  onModuleInit() {
    this.registry.register(this.cibc);
    this.registry.register(this.rbc);
    this.registry.register(this.td);
    this.registry.register(this.bmo);
  }
}