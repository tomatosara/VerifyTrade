import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches
} from 'class-validator';
import {
  IDENTITY_REQUIREMENT_PATTERN,
  TradeFormChannel,
  TradeFormItemCondition,
  TradeFormMatchmakingChannel,
  TradeFormPaymentMethod,
  TradeFormIdentityRequirement
} from '../enums/TradeFormEnums';
import { AMOUNT_REGEX } from '../utils/amount';

const UID_PATTERN = /^[A-Za-z0-9_-]+$/;

export class CreateTradeFormDto {
  /**
   * 前端生成的交易序號，建立雙方共用。
   * @example "P2P-7f4c8d90"
   */
  @IsString()
  @Length(6, 128)
  @Matches(UID_PATTERN, {
    message: 'uid may only contain letters, digits, underscores, or dashes'
  })
  uid!: string;

  /**
   * 建立者的使用者識別（需與 JWT 內 idNumber 一致）。
   * @example "A131095852"
   */
  @IsString()
  @IsNotEmpty()
  creatorId!: string;

  /**
   * 已驗證身分(創建者) / Creator verified identities
   * @example ["tw_national_id", "phone_verified"]
   */
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  @Matches(IDENTITY_REQUIREMENT_PATTERN, {
    each: true,
    message: 'creatorVerifiedIdentities must use snake_case strings (e.g. tw_national_id)'
  })
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

  /**
   * 商品狀態
   * @example "used_like_new"
   */
  @IsEnum(TradeFormItemCondition)
  itemCondition!: TradeFormItemCondition;

  /**
   * 交易金額 / Amount (string to keep currency format)
   * @example "22000.50"
   */
  @IsString()
  @IsNotEmpty()
  @Matches(AMOUNT_REGEX, {
    message: 'amount must be a positive decimal string with up to 18 decimal places'
  })
  amount!: string;

  /**
   * 交易管道
   * @example "p2p"
   */
  @IsEnum(TradeFormChannel)
  tradeChannel!: TradeFormChannel;

  /**
   * 付款方式
   * @example "bank_transfer"
   */
  @IsEnum(TradeFormPaymentMethod)
  paymentMethod!: TradeFormPaymentMethod;

  /**
   * 媒合管道
   * @example "in_app"
   */
  @IsEnum(TradeFormMatchmakingChannel)
  matchmakingChannel!: TradeFormMatchmakingChannel;

  /**
   * 身份驗證條件 (複選) / Identity requirements (multi-select)
   * @example ["tw_national_id", "phone_verified"]
   */
  @IsArray()
  @IsString({ each: true })
  @Matches(IDENTITY_REQUIREMENT_PATTERN, {
    each: true,
    message: 'identityRequirements must use snake_case strings (e.g. tw_national_id)'
  })
  identityRequirements!: TradeFormIdentityRequirement[];
}
