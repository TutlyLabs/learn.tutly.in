import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
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

type SubscriptionStatus = "NotSubscribed" | "Subscribed" | "NotSupported";

function getNotificationLink(notification: Notification): string | null {
  const config = NOTIFICATION_TYPES[notification.eventType] || DEFAULT_NOTIFICATION_CONFIG;
  if (!config) return null;
  return config.getLink(notification.causedObjects as causedObjects).href;
}

export default function Notifications({ user }: { user: SessionUser }) {
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>("NotSupported");
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

  const updateNotificationConfig = async (deviceToken: string, platform: string) => {
    try {
      await actions.notifications_updateNotificationConfig({
        userId: user.id,
        deviceToken,
        platform,
      });
    } catch {
      toast.error("Failed to update notification config");
    }
  };

  const initializeCapacitorPushNotifications = async () => {
    if (!Capacitor.isNativePlatform()) {
      setSubscriptionStatus("NotSupported");
      return;
    }

    try {
      // Check current permission status
      let permissionStatus = await PushNotifications.checkPermissions();

      if (permissionStatus.receive === "prompt") {
        // Request permission if not granted
        permissionStatus = await PushNotifications.requestPermissions();
      }

      if (permissionStatus.receive !== "granted") {
        setSubscriptionStatus("NotSupported");
        return;
      }

      // Check if already registered
      const config = await actions.notifications_getNotificationConfig({ userId: user.id });
      if (config.data?.deviceToken) {
        setSubscriptionStatus("Subscribed");
      } else {
        setSubscriptionStatus("NotSubscribed");
      }

      // Set up listeners
      PushNotifications.addListener("registration", async (token) => {
        const platform = Capacitor.getPlatform();
        await updateNotificationConfig(token.value, platform);
        setSubscriptionStatus("Subscribed");
        toast.success("Push notifications enabled");
      });

      PushNotifications.addListener("registrationError", (err) => {
        console.error("Registration error: ", err.error);
        toast.error("Failed to enable push notifications");
        setSubscriptionStatus("NotSupported");
      });

      PushNotifications.addListener("pushNotificationReceived", (_notification) => {
        // Refresh notifications when a new one is received
        fetchNotifications();
      });

      PushNotifications.addListener("pushNotificationActionPerformed", (notification) => {
        // Handle notification tap - navigate to notification details
        if (notification.notification.data?.notificationId) {
          navigate(`/notifications/${notification.notification.data.notificationId}`);
        }
      });
    } catch (error) {
      console.error("Failed to initialize Capacitor push notifications:", error);
      setSubscriptionStatus("NotSupported");
    }
  };

  const subscribe = async () => {
    if (!user?.id || !Capacitor.isNativePlatform()) {
      toast.error("Push notifications are not supported");
      return;
    }

    try {
      setIsSubscribing(true);
      await PushNotifications.register();
    } catch (error) {
      console.error("Failed to register for push notifications:", error);
      toast.error("Failed to enable push notifications");
    } finally {
      setIsSubscribing(false);
    }
  };

  const unsubscribe = async () => {
    if (!user?.id) return;

    try {
      setIsSubscribing(true);

      // Remove device token from server
      await updateNotificationConfig("", "");

      if (Capacitor.isNativePlatform()) {
        // Remove all listeners
        await PushNotifications.removeAllListeners();
      }

      setSubscriptionStatus("NotSubscribed");
      toast.warning("Push notifications disabled");
    } catch (error) {
      console.error("Failed to unsubscribe:", error);
      toast.error("Failed to disable push notifications");
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
    if (subscriptionStatus === "Subscribed") {
      unsubscribe();
    } else if (subscriptionStatus === "NotSubscribed") {
      subscribe();
    } else {
      // On web, show toast encouraging app install
      if (!Capacitor.isNativePlatform()) {
        toast.message("Install our mobile app for push notifications!", {
          description: "Push notifications are available in our Android and iOS apps",
          duration: 5000,
        });
      } else {
        toast.error("Push notifications are not supported on this device");
      }
    }
  };

  useEffect(() => {
    if (user?.id) {
      initializeCapacitorPushNotifications();
    }
  }, [user?.id]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const getSubscriptionButtonText = () => {
    switch (subscriptionStatus) {
      case "Subscribed":
        return "Unsubscribe";
      case "NotSubscribed":
        return "Subscribe";
      case "NotSupported":
      default:
        return Capacitor.isNativePlatform() ? "Not Supported" : "Install App";
    }
  };

  const getSubscriptionTooltipText = () => {
    if (subscriptionStatus === "Subscribed") {
      return "Disable push notifications";
    } else if (subscriptionStatus === "NotSubscribed") {
      return "Enable push notifications";
    } else {
      return Capacitor.isNativePlatform()
        ? "Push notifications not supported on this device"
        : "Install our mobile app to receive push notifications";
    }
  };

  const refetchNotifications = fetchNotifications;

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
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSubscribeClick}
                      disabled={isSubscribing}
                      className="flex px-1 items-center gap-1.5 text-xs text-muted-foreground hover:text-primary h-8"
                    >
                      {isSubscribing ? (
                        <RefreshCcw className="h-3.5 w-3.5 animate-spin" />
                      ) : subscriptionStatus === "Subscribed" ? (
                        <BellOff className="h-3.5 w-3.5" />
                      ) : (
                        <Bell className="h-3.5 w-3.5" />
                      )}
                      <span>{getSubscriptionButtonText()}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{getSubscriptionTooltipText()}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
