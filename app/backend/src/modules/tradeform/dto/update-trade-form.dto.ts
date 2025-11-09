import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min
} from 'class-validator';
import {
  IDENTITY_REQUIREMENT_PATTERN,
  TradeFormChannel,
  TradeFormIdentityRequirement,
  TradeFormItemCondition,
  TradeFormMatchmakingChannel,
  TradeFormPaymentMethod
} from '../enums/TradeFormEnums';
import { AMOUNT_REGEX } from '../utils/amount';

export class UpdateTradeFormDto {
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  @Matches(IDENTITY_REQUIREMENT_PATTERN, {
    each: true,
    message: 'creatorVerifiedIdentities must use snake_case strings (e.g. tw_national_id)'
  })
  creatorVerifiedIdentities?: string[];

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  itemName?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  itemDescription?: string;

  @IsEnum(TradeFormItemCondition)
  @IsOptional()
  itemCondition?: TradeFormItemCondition;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @Matches(AMOUNT_REGEX, {
    message: 'amount must be a positive decimal string with up to 18 decimal places'
  })
  amount?: string;

  @IsEnum(TradeFormChannel)
  @IsOptional()
  tradeChannel?: TradeFormChannel;

  @IsEnum(TradeFormPaymentMethod)
  @IsOptional()
  paymentMethod?: TradeFormPaymentMethod;

  @IsEnum(TradeFormMatchmakingChannel)
  @IsOptional()
  matchmakingChannel?: TradeFormMatchmakingChannel;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @Matches(IDENTITY_REQUIREMENT_PATTERN, {
    each: true,
    message: 'identityRequirements must use snake_case strings (e.g. tw_national_id)'
  })
  @IsOptional()
  identityRequirements?: TradeFormIdentityRequirement[];

  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  userRating?: number;
}
