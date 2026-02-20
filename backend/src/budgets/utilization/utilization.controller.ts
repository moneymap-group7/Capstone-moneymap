import { Controller, Get, Query } from "@nestjs/common";
import { UtilizationService } from "./utilization.service";

@Controller("budgets/utilization")
export class UtilizationController {
  constructor(private readonly utilizationService: UtilizationService) {}

  // TODO replace with JWT later
  private readonly userId = BigInt(1);

  @Get()
  async utilization(
    @Query("start") startStr: string,
    @Query("end") endStr: string
  ) {
    const start = new Date(`${startStr}T00:00:00.000Z`);
    const end = new Date(`${endStr}T23:59:59.999Z`);

    const data = await this.utilizationService.getUtilizationForRange(
      this.userId,
      start,
      end
    );

    return { data };
  }

  @Get("compare")
  async compare(
    @Query("start") startStr: string,
    @Query("end") endStr: string
  ) {
    const start = new Date(`${startStr}T00:00:00.000Z`);
    const end = new Date(`${endStr}T23:59:59.999Z`);

    const data = await this.utilizationService.compareRanges(
      this.userId,
      start,
      end
    );

    return { data };
  }

  @Get("mock")
  mock() {
    return { message: "Mock endpoint still available" };
  }
}