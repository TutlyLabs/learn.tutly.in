import type { Notification, NotificationEvent } from "@prisma/client";
import { actions } from "astro:actions";
import { navigate } from "astro:transitions/client";
import {
  Bell,
  BellOff,
  BookOpen,
  Eye,
  EyeOff,
  Filter,
  Mail,
  MailOpen,
  MessageSquare,
  RefreshCcw,
  UserMinus,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { SessionUser } from "@/lib/auth/session";
import day from "@/lib/dayjs";
import { cn } from "@/lib/utils";

interface NotificationLink {
  href: string;
  external?: boolean;
}

type NotificationEventTypes = keyof typeof NotificationEvent;

export interface causedObjects {
  courseId?: string;
  classId?: string;
  assignmentId?: string;
  doubtId?: string;
}

export const NOTIFICATION_HREF_MAP: Record<NotificationEventTypes, (obj: causedObjects) => string> =
  {
    CLASS_CREATED: (obj: causedObjects) => `/classes/${obj.classId}`,
    ASSIGNMENT_CREATED: (obj: causedObjects) => `/assignments/${obj.assignmentId}`,
    ASSIGNMENT_REVIEWED: (obj: causedObjects) => `/assignments/${obj.assignmentId}`,
    LEADERBOARD_UPDATED: (_obj: causedObjects) => `/leaderboard`,
    DOUBT_RESPONDED: (obj: causedObjects) => `/doubts/${obj.doubtId}`,
    ATTENDANCE_MISSED: (_obj: causedObjects) => `/attendance`,
    CUSTOM_MESSAGE: (_obj: causedObjects) => `/`,
  };

const DEFAULT_NOTIFICATION_CONFIG = {
  label: "Notification",
  icon: Bell,
  color: "text-gray-500",
  bgColor: "bg-gray-500/10",
  getLink: () => ({
    href: "#",
    external: false,
  }),
};

const NOTIFICATION_TYPES: Record<
  NotificationEventTypes,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    getLink: (causedObjects: causedObjects) => NotificationLink;
  }
> = {
  CLASS_CREATED: {
    label: "Classes",
    icon: BookOpen,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    getLink: (obj) => ({
      href: NOTIFICATION_HREF_MAP["CLASS_CREATED"](obj),
      external: true,
    }),
  },
  ASSIGNMENT_CREATED: {
    label: "Assignments",
    icon: BookOpen,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    getLink: (obj) => ({
      href: NOTIFICATION_HREF_MAP["ASSIGNMENT_CREATED"](obj),
      external: true,
    }),
  },
  ASSIGNMENT_REVIEWED: {
    label: "Reviews",
    icon: Eye,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    getLink: (obj) => ({
      href: NOTIFICATION_HREF_MAP["ASSIGNMENT_REVIEWED"](obj),
      external: true,
    }),
  },
  LEADERBOARD_UPDATED: {
    label: "Leaderboard",
    icon: RefreshCcw,
    color: "text-amber-400",
    bgColor: "bg-amber-400/10",
    getLink: (obj) => ({
      href: NOTIFICATION_HREF_MAP["LEADERBOARD_UPDATED"](obj),
      external: true,
    }),
  },
  DOUBT_RESPONDED: {
    label: "Doubts",
    icon: MessageSquare,
    color: "text-gray-500",
    bgColor: "bg-gray-500/10",
    getLink: (obj) => ({
      href: NOTIFICATION_HREF_MAP["DOUBT_RESPONDED"](obj),
      external: true,
    }),
  },
  ATTENDANCE_MISSED: {
    label: "Attendance",
    icon: UserMinus,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    getLink: (obj) => ({
      href: NOTIFICATION_HREF_MAP["ATTENDANCE_MISSED"](obj),
      external: true,
    }),
  },
  CUSTOM_MESSAGE: {
    label: "Messages",
    icon: MessageSquare,
    color: "text-gray-500",
    bgColor: "bg-gray-500/10",
    getLink: (obj) => ({
      href: NOTIFICATION_HREF_MAP["CUSTOM_MESSAGE"](obj),
      external: false,
    }),
  },
};

const filterCategories = Object.entries(NOTIFICATION_TYPES).map(([type, config]) => ({
  type,
  label: config.label,
}));

type SubscriptionStatus = "NotSubscribed" | "SubscribedOnThisDevice" | "SubscribedOnAnotherDevice";

interface PushSubscriptionConfig {
  endpoint: string;
  p256dh: string;
  auth: string;
}

function getNotificationLink(notification: Notification): string | null {
  const config = NOTIFICATION_TYPES[notification.eventType] || DEFAULT_NOTIFICATION_CONFIG;
  if (!config) return null;
  return config.getLink(notification.causedObjects as causedObjects).href;
}

export default function Notifications({ user }: { user: SessionUser }) {
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>("NotSubscribed");
  const [activeTab, setActiveTab] = useState("all");

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isRefetchingNotifications, setIsRefetchingNotifications] = useState(false);

  const fetchNotifications = async () => {
    setIsRefetchingNotifications(true);
    try {
      const result = await actions.notifications_getNotifications();
      if (result.data) {
        setNotifications(result.data);
      }
    } catch {
      toast.error("Failed to fetch notifications");
    } finally {
      setIsRefetchingNotifications(false);
    }
  };

  const toggleReadStatus = async (id: string) => {
    try {
      await actions.notifications_toggleNotificationAsReadStatus({ id });
      await fetchNotifications();
    } catch {
      toast.error("Failed to update notification");
    }
  };

  const markAllAsRead = async () => {
    try {
      await actions.notifications_markAllNotificationsAsRead();
      await fetchNotifications();
    } catch {
      toast.error("Failed to mark all as read");
    }
  };

  const getNotificationConfig = async (userId: string) => {
    const result = await actions.notifications_getNotificationConfig({ userId });
    return result.data;
  };

  const updateNotificationConfig = async (userId: string, config: PushSubscriptionConfig) => {
    try {
      await actions.notifications_updateNotificationConfig({ userId, config });
    } catch {
      toast.error("Failed to update notification config");
    }
  };

  const initialSubscriptionState = async () => {
    try {
      if (!user?.id) return;

      const config = await getNotificationConfig(user.id);
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();

      // If no config endpoint exists, user is not subscribed anywhere
      if (!config?.endpoint) {
        // If we have a subscription on this device but no config, clean it up
        if (subscription) {
          await subscription.unsubscribe();
        }
        setSubscriptionStatus("NotSubscribed");
        return;
      }

      // If there's a subscription on this device
      if (subscription) {
        // Compare current subscription endpoint with stored config
        if (subscription.endpoint === config.endpoint) {
          setSubscriptionStatus("SubscribedOnThisDevice");
        } else {
          // Different subscription exists on this device - clean up and
          // recognize the one on the server as the valid one
          console.log("Different subscription exists - cleaning up local subscription");
          await subscription.unsubscribe(); // Clean up old subscription
          setSubscriptionStatus("SubscribedOnAnotherDevice");
        }
      } else {
        // No subscription on this device, but config exists
        setSubscriptionStatus("SubscribedOnAnotherDevice");
      }
    } catch (error) {
      console.error("Failed to fetch subscription status:", error);
      toast.error("Failed to fetch subscription status");
    }
  };

  const subscribe = async () => {
    if (!user?.id) return;

    try {
      setIsSubscribing(true);

      if (!("serviceWorker" in navigator)) {
        toast.error("Service Workers are not supported in this browser");
        return;
      }

      if (!("PushManager" in window)) {
        toast.error("Push notifications are not supported in this browser");
        return;
      }

      if (Notification.permission === "denied") {
        toast.warning("Notification permission denied");
        return;
      }

      if (Notification.permission !== "granted") {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          toast.warning("Notification permission denied");
          return;
        }
      }

      const public_key =
        "BIXtNCh-RojjGDEG9fEl9FNLY6YTFI-WeNhiumk9VYBTObZOs6l6thdm2Lrtttu4q-qL-QeAoaMD--vcavgR9d8";
      // if (!public_key) {
      //   toast.error("Failed to get public key");
      //   return;
      // }

      try {
        const sw = await navigator.serviceWorker.ready;
        if (!sw.pushManager) {
          toast.error("Push manager not available");
          return;
        }

        const subscription = await sw.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: public_key,
        });

        if (!subscription) {
          toast.error("Failed to create subscription");
          return;
        }

        const p256dh = btoa(
          String.fromCharCode.apply(
            null,
            Array.from(new Uint8Array(subscription.getKey("p256dh") as ArrayBuffer))
          )
        );

        const auth = btoa(
          String.fromCharCode.apply(
            null,
            Array.from(new Uint8Array(subscription.getKey("auth") as ArrayBuffer))
          )
        );

        const config: PushSubscriptionConfig = {
          endpoint: subscription.endpoint,
          p256dh: p256dh,
          auth: auth,
        };

        await updateNotificationConfig(user.id, config);

        setSubscriptionStatus("SubscribedOnThisDevice");
        toast.success("Subscribed successfully");
      } catch {
        toast.error("Service worker subscription failed");
        return;
      }
    } catch {
      toast.error("Subscription failed");
    } finally {
      setIsSubscribing(false);
    }
  };

  const unsubscribe = async () => {
    if (!user?.id) return;

    try {
      const reg = await navigator.serviceWorker.ready;
      if (!reg.pushManager) {
        toast.error("Push manager not available");
        return;
      }

      setIsSubscribing(true);
      const subscription = await reg.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        await updateNotificationConfig(user.id, {
          endpoint: "",
          p256dh: "",
          auth: "",
        });

        setSubscriptionStatus("NotSubscribed");
        toast.warning("Unsubscribed successfully");
      }
    } catch {
      toast.error("Unsubscribe failed");
    } finally {
      setIsSubscribing(false);
    }
  };

  const unreadCount = useMemo(
    () => notifications.filter((n: Notification) => !n.readAt).length,
    [notifications]
  );

  const [selectedCategories, setSelectedCategories] = useState<NotificationEventTypes[]>([]);

  const filteredNotifications = useMemo(
    () =>
      notifications.filter(
        (n: Notification) =>
          selectedCategories.length === 0 || selectedCategories.includes(n.eventType)
      ),
    [notifications, selectedCategories]
  );

  const handleNotificationClick = (notification: Notification) => {
    const notificationType =
      NOTIFICATION_TYPES[notification.eventType] || DEFAULT_NOTIFICATION_CONFIG;
    if (!notificationType) return;
    if (!notification.readAt) {
      toggleReadStatus(notification.id);
    }

    if (notification.customLink) {
      window.open(notification.customLink, "_blank");
      return;
    }

    const link = notificationType.getLink(notification.causedObjects as causedObjects);
    if (link) {
      if (link.external) {
        window.open(link.href, "_blank");
      } else {
        navigate(link.href);
      }
    }
  };

  const handleSubscribeClick = () => {
    if (!navigator.serviceWorker) {
      toast.error("Push notifications are not supported in this browser");
      return;
    }

    if (subscriptionStatus === "SubscribedOnThisDevice") {
      unsubscribe();
    } else {
      subscribe();
    }
  };

  useEffect(() => {
    let mounted = true;

    const checkSubscription = async () => {
      if (!mounted) return;
      await initialSubscriptionState();
    };

    checkSubscription();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const getSubscriptionButtonText = () => {
    switch (subscriptionStatus) {
      case "SubscribedOnThisDevice":
        return "Unsubscribe";
      case "SubscribedOnAnotherDevice":
        return "Subscribe on this device";
      case "NotSubscribed":
      default:
        return "Subscribe";
    }
  };

  const refetchNotifications = fetchNotifications;

  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile && subscriptionStatus === "NotSubscribed") {
      const lastToastTime = localStorage.getItem("lastNotificationToastTime");
      const currentTime = new Date().getTime();
      const oneWeek = 7 * 24 * 60 * 60 * 1000; // One week in milliseconds

      if (!lastToastTime || currentTime - parseInt(lastToastTime) > oneWeek) {
        toast.message("Enable notifications", {
          description: "Stay updated with your course notifications",
          action: {
            label: "Subscribe",
            onClick: handleSubscribeClick,
          },
        });
        localStorage.setItem("lastNotificationToastTime", currentTime.toString());
      }
    }
  }, [isMobile, subscriptionStatus]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 hover:bg-accent/50"
          aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ""}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[440px] p-0 rounded-lg">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <div className="border-b px-4 py-1 flex items-center justify-between">
            <TabsList className="bg-transparent p-0">
              <TabsTrigger value="all">
                <Bell className="h-4 w-4 mr-2" />
                All
              </TabsTrigger>
              <TabsTrigger value="unread">
                <EyeOff className="h-4 w-4 mr-2" />
                Unread{" "}
                {unreadCount > 0 && (
                  <span className="ml-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs">
                    {unreadCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
            <div className="float-right flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSubscribeClick}
                disabled={isSubscribing}
                className="flex px-1 items-center gap-1.5 text-xs text-muted-foreground hover:text-primary h-8"
              >
                {isSubscribing ? (
                  <RefreshCcw className="h-3.5 w-3.5 animate-spin" />
                ) : subscriptionStatus === "SubscribedOnThisDevice" ? (
                  <BellOff className="h-3.5 w-3.5" />
                ) : (
                  <Bell className="h-3.5 w-3.5" />
                )}
                <span>{getSubscriptionButtonText()}</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => refetchNotifications()}
                disabled={isRefetchingNotifications}
              >
                <RefreshCcw
                  className={cn("h-4 w-4", isRefetchingNotifications && "animate-spin")}
                />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Filter by type</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {filterCategories.map(({ type, label }) => (
                    <DropdownMenuCheckboxItem
                      key={type}
                      checked={selectedCategories.includes(type as NotificationEventTypes)}
                      onCheckedChange={(checked) => {
                        setSelectedCategories(
                          checked
                            ? [...selectedCategories, type as NotificationEventTypes]
                            : selectedCategories.filter((t) => t !== type)
                        );
                      }}
                    >
                      {label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {["all", "unread"].map((tab) => (
            <TabsContent key={tab} value={tab} className="m-0">
              {selectedCategories.length > 0 && (
                <div className="px-4 py-1 border-b flex overflow-x-auto items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {selectedCategories.map((category) => (
                      <div
                        key={category}
                        className="text-xs bg-primary/10 text-primary rounded-full px-3 py-1.5 flex items-center gap-1.5"
                      >
                        {filterCategories.find((f) => f.type === category)?.label}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 p-0.5 hover:bg-primary/20"
                          onClick={() =>
                            setSelectedCategories(selectedCategories.filter((t) => t !== category))
                          }
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-primary -ml-2"
                    onClick={() => setSelectedCategories([])}
                  >
                    Clear all
                  </Button>
                </div>
              )}

              <div className="overflow-y-auto h-[370px]">
                <div className="space-y-1 py-2">
                  {filteredNotifications
                    .filter((n: Notification) => (tab === "all" ? true : !n.readAt))
                    .map((notification: Notification) => {
                      const config =
                        NOTIFICATION_TYPES[notification.eventType] || DEFAULT_NOTIFICATION_CONFIG;
                      return (
                        <div
                          key={notification.id}
                          className={cn(
                            "group flex items-center gap-4 px-4 py-3 hover:bg-accent/20",
                            getNotificationLink(notification) && "cursor-pointer"
                          )}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div
                            className={cn(
                              "rounded-full p-2 flex items-center justify-center h-fit",
                              config.bgColor,
                              notification.readAt && "opacity-50"
                            )}
                          >
                            <config.icon className={cn("h-5 w-5", config.color)} />
                          </div>
                          <div className="space-y-1 flex-1">
                            <p
                              className={cn(
                                "text-sm leading-tight",
                                notification.readAt && "text-muted-foreground"
                              )}
                            >
                              {notification.message}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {day(notification.createdAt).fromNow()}
                            </p>
                          </div>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleReadStatus(notification.id);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                                >
                                  {notification.readAt ? (
                                    <MailOpen className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <Mail className="h-4 w-4 text-primary" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {notification.readAt ? "Mark as unread" : "Mark as read"}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      );
                    })}
                </div>

                {filteredNotifications.filter((n: Notification) =>
                  tab === "all" ? true : !n.readAt
                ).length === 0 && (
                  <div className="h-full flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <Eye className="h-8 w-8 text-muted-foreground/50" />
                      <span className="text-sm text-muted-foreground">
                        {selectedCategories.length > 0
                          ? "No notifications in selected categories"
                          : tab === "unread"
                            ? "No unread notifications"
                            : "No notifications"}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t bg-background h-12">
                <Button
                  variant="ghost"
                  className="w-full h-full justify-center text-muted-foreground hover:text-primary hover:bg-accent/50"
                  onClick={() => markAllAsRead()}
                >
                  Mark All as Read
                </Button>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
