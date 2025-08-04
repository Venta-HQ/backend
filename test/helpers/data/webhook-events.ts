import { UserWebhookEvent } from '@clerk/clerk-sdk-node';
import { RevenueCatWebhookEvent, RevenueCatInitialPurchaseEventData, RevenueCatHandledEventTypes } from '@app/apitypes';

/**
 * Webhook event data factories
 */

/**
 * Creates a Clerk webhook event
 */
export function createClerkWebhookEvent(
  type: 'user.created' | 'user.deleted' | 'user.updated',
  data: Partial<UserWebhookEvent['data']> = {}
): UserWebhookEvent {
  const baseEvent: UserWebhookEvent = {
    type,
    data: {
      id: 'clerk_user_123',
      email_addresses: [{ email_address: 'test@example.com' }],
      first_name: 'John',
      last_name: 'Doe',
      ...data,
    },
    object: 'event',
    created_at: Date.now(),
  };

  return baseEvent;
}

/**
 * Creates a RevenueCat webhook event
 */
export function createRevenueCatWebhookEvent(
  type: string,
  data: Partial<RevenueCatInitialPurchaseEventData> = {}
): RevenueCatWebhookEvent<RevenueCatInitialPurchaseEventData> {
  const baseEvent: RevenueCatWebhookEvent<RevenueCatInitialPurchaseEventData> = {
    event: {
      type: type as any,
      id: 'event_123',
      product_id: 'premium_monthly',
      transaction_id: 'txn_456',
      subscriber_attributes: {
        clerkUserId: 'clerk_user_123',
      },
      ...data,
    },
  };

  return baseEvent;
}

/**
 * Creates a RevenueCat initial purchase event
 */
export function createRevenueCatInitialPurchaseEvent(
  data: Partial<RevenueCatInitialPurchaseEventData> = {}
): RevenueCatWebhookEvent<RevenueCatInitialPurchaseEventData> {
  return createRevenueCatWebhookEvent(RevenueCatHandledEventTypes.INITIAL_PURCHASE, data);
}

/**
 * Common webhook event patterns
 */
export const webhookEvents = {
  /**
   * Clerk events
   */
  clerk: {
    userCreated: (data?: Partial<UserWebhookEvent['data']>) => 
      createClerkWebhookEvent('user.created', data),
    userDeleted: (data?: Partial<UserWebhookEvent['data']>) => 
      createClerkWebhookEvent('user.deleted', data),
    userUpdated: (data?: Partial<UserWebhookEvent['data']>) => 
      createClerkWebhookEvent('user.updated', data),
  },

  /**
   * RevenueCat events
   */
  revenueCat: {
    initialPurchase: (data?: Partial<RevenueCatInitialPurchaseEventData>) => 
      createRevenueCatInitialPurchaseEvent(data),
    renewal: (data?: Partial<RevenueCatInitialPurchaseEventData>) => 
      createRevenueCatWebhookEvent('RENEWAL', data),
    cancellation: (data?: Partial<RevenueCatInitialPurchaseEventData>) => 
      createRevenueCatWebhookEvent('CANCELLATION', data),
  },
}; 