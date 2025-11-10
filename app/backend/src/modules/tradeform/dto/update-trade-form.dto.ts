import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateTradeFormDto {
  @IsString()
  @IsNotEmpty()
  counterpartyId!: string;
}
