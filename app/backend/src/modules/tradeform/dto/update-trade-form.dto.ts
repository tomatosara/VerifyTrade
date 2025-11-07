import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min
} from 'class-validator';
import {
  TradeFormChannel,
  TradeFormIdentityRequirement,
  TradeFormItemCondition,
  TradeFormMatchmakingChannel,
  TradeFormPaymentMethod
} from '../enums/TradeFormEnums';

export class UpdateTradeFormDto {
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
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
  @IsEnum(TradeFormIdentityRequirement, { each: true })
  @IsOptional()
  identityRequirements?: TradeFormIdentityRequirement[];

  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  userRating?: number;
}
