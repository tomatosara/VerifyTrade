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

export class CreateTradeFormDto {
  /** 
   * A idNumber
   * @example A131095852
   */
  @IsString()
  @IsOptional()
  creatorId?: string;

  /** 
   * B idNumber
   * @example F123456789
   */
  @IsString()
  @IsOptional()
  counterpartyId?: string;

  /**
   * 已驗證身分(創建者) / Creator verified identities
   * @example ["StudentID", "CompanyEmail"]
   */
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  creatorVerifiedIdentities?: string[];

  /**
   * 交易商品 / Item name
   * @example "iPad Pro 11\""
   */
  @IsString()
  @IsNotEmpty()
  itemName!: string;

  /**
   * 商品說明 / Item description
   * @example "盒裝完整，含原廠鍵盤"
   */
  @IsString()
  @IsNotEmpty()
  itemDescription!: string;

  /** 商品狀態：{ 二手 || 二手近全新 || 全新 } */
  @IsEnum(TradeFormItemCondition)
  itemCondition!: TradeFormItemCondition;

  /**
   * 交易金額 / Amount (string to keep currency format)
   * @example "22000"
   */
  @IsString()
  @IsNotEmpty()
  amount!: string;

  /** 交易管道：{ 面交 || 交貨便 || 郵局 || 快遞 || 其他 } */
  @IsEnum(TradeFormChannel)
  tradeChannel!: TradeFormChannel;

  /** 付款方式：{ 面交 || 匯款 || LinePay || 加密貨幣 } */
  @IsEnum(TradeFormPaymentMethod)
  paymentMethod!: TradeFormPaymentMethod;

  /** 交易媒合管道：{ 線下合議 || 社交平台 || 網路交易平台 } */
  @IsEnum(TradeFormMatchmakingChannel)
  matchmakingChannel!: TradeFormMatchmakingChannel;

  /**
   * 身份驗證條件 (複選) / Identity requirements (multi-select)
   * @example ["STUDENT_ID", "PROOF_OF_ORIGIN"]
   */
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(TradeFormIdentityRequirement, { each: true })
  identityRequirements!: TradeFormIdentityRequirement[];

  /** 用戶評分：{1..5} */
  @IsInt()
  @Min(1)
  @Max(5)
  userRating!: number;
}
