import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';
import {
  IDENTITY_REQUIREMENT_PATTERN,
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

  @IsString()
  @Matches(IDENTITY_REQUIREMENT_PATTERN, {
    message: 'identityRequirement must use snake_case strings (e.g. tw_national_id)'
  })
  @IsOptional()
  identityRequirement?: TradeFormIdentityRequirement;
}
