import { IsEnum, IsOptional } from 'class-validator';
import {
  TradeFormChannel,
  TradeFormIdentityRequirement,
  TradeFormItemCondition,
  TradeFormMatchmakingChannel,
  TradeFormPaymentMethod
} from '../enums/TradeFormEnums';

export class TradeFormQueryDto {
  @IsEnum(TradeFormItemCondition)
  @IsOptional()
  itemCondition?: TradeFormItemCondition;

  @IsEnum(TradeFormChannel)
  @IsOptional()
  tradeChannel?: TradeFormChannel;

  @IsEnum(TradeFormPaymentMethod)
  @IsOptional()
  paymentMethod?: TradeFormPaymentMethod;

  @IsEnum(TradeFormMatchmakingChannel)
  @IsOptional()
  matchmakingChannel?: TradeFormMatchmakingChannel;

  @IsEnum(TradeFormIdentityRequirement)
  @IsOptional()
  identityRequirement?: TradeFormIdentityRequirement;
}
