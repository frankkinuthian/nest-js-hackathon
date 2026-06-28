import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Query parameters for listing hackathons with cursor-based pagination.
 *
 * - `take` controls page size (default 10, max 50).
 * - `cursor` is the `id` of the last item from the previous page.
 *   Omit on the first request; pass `nextCursor` from the response for subsequent pages.
 */
export class ListHackathonsQueryDto {
  /** Number of records to return per page. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  take?: number = 10;

  /** ID of the last record from the previous page (cursor). Omit for the first page. */
  @IsOptional()
  @IsString()
  cursor?: string;
}
