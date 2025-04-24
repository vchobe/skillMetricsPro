import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ReportSettings } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { queryClient } from '@/lib/queryClient';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { formatDate } from '@/lib/date-utils';
import { Loader2, Plus, Edit, Trash2, PenSquare, Calendar, Send, ArrowDownUp, FileText, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Form schema for report settings
const reportSettingSchema = z.object({
  name: z.string().min(1, "Name is required"),
  frequency: z.enum(["daily", "weekly", "monthly"]),
  dayOfWeek: z.number().min(0).max(6).nullable().optional(),
  dayOfMonth: z.number().min(1).max(31).nullable().optional(),
  recipientEmail: z.string().email("Invalid email address"),
  active: z.boolean().default(true),
  clientId: z.number().nullable().optional(),
  description: z.string().optional()
});

type ReportSettingFormValues = z.infer<typeof reportSettingSchema>;

interface ReportSettingsManagerProps {
  showAddReportDialog: boolean;
  setShowAddReportDialog: (show: boolean) => void;
  selectedReportSetting: ReportSettings | null;
  setSelectedReportSetting: (setting: ReportSettings | null) => void;
  showEditReportDialog: boolean;
  setShowEditReportDialog: (show: boolean) => void;
  showDeleteReportConfirm: boolean;
  setShowDeleteReportConfirm: (show: boolean) => void;
  reportSettings: ReportSettings[];
  isLoadingReportSettings: boolean;
  refetchReportSettings: () => void;
  createReportSettingMutation: any;
  updateReportSettingMutation: any;
  deleteReportSettingMutation: any;
}

export function ReportSettingsManager({
  showAddReportDialog,
  setShowAddReportDialog,
  selectedReportSetting,
  setSelectedReportSetting,
  showEditReportDialog,
  setShowEditReportDialog,
  showDeleteReportConfirm,
  setShowDeleteReportConfirm,
  reportSettings,
  isLoadingReportSettings,
  refetchReportSettings,
  createReportSettingMutation,
  updateReportSettingMutation,
  deleteReportSettingMutation
}: ReportSettingsManagerProps) {
  const { toast } = useToast();
  
  // Get clients for populating the client selection dropdown
  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ["/api/clients"],
  });
  
  // Form for adding/editing report settings
  const form = useForm<ReportSettingFormValues>({
    resolver: zodResolver(reportSettingSchema),
    defaultValues: {
      name: "",
      frequency: "weekly",
      dayOfWeek: 1, // Monday
      dayOfMonth: null,
      recipientEmail: process.env.SALES_TEAM_EMAIL || "",
      active: true,
      clientId: null,
      description: ""
    }
  });
  
  // Reset form when dialog closes
  React.useEffect(() => {
    if (!showAddReportDialog && !showEditReportDialog) {
      form.reset();
    }
  }, [showAddReportDialog, showEditReportDialog, form]);
  
  // Set form values when editing
  React.useEffect(() => {
    if (selectedReportSetting && showEditReportDialog) {
      form.reset({
        name: selectedReportSetting.name,
        frequency: selectedReportSetting.frequency,
        dayOfWeek: selectedReportSetting.dayOfWeek,
        dayOfMonth: selectedReportSetting.dayOfMonth,
        recipientEmail: selectedReportSetting.recipientEmail,
        active: selectedReportSetting.active,
        clientId: selectedReportSetting.clientId,
        description: selectedReportSetting.description || ""
      });
    }
  }, [selectedReportSetting, showEditReportDialog, form]);
  
  // Handler for creating a new report setting
  const handleCreateReportSetting = (data: ReportSettingFormValues) => {
    createReportSettingMutation.mutate(data, {
      onSuccess: () => {
        toast({
          title: "Report setting created",
          description: "The report setting has been created successfully",
          variant: "default"
        });
        setShowAddReportDialog(false);
        refetchReportSettings();
      },
      onError: (error: Error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to create report setting",
          variant: "destructive"
        });
      }
    });
  };
  
  // Handler for updating a report setting
  const handleUpdateReportSetting = (data: ReportSettingFormValues) => {
    if (!selectedReportSetting) return;
    
    updateReportSettingMutation.mutate({
      id: selectedReportSetting.id,
      data
    }, {
      onSuccess: () => {
        toast({
          title: "Report setting updated",
          description: "The report setting has been updated successfully",
          variant: "default"
        });
        setShowEditReportDialog(false);
        setSelectedReportSetting(null);
        refetchReportSettings();
      },
      onError: (error: Error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to update report setting",
          variant: "destructive"
        });
      }
    });
  };
  
  // Handler for deleting a report setting
  const handleDeleteReportSetting = () => {
    if (!selectedReportSetting) return;
    
    deleteReportSettingMutation.mutate(selectedReportSetting.id, {
      onSuccess: () => {
        toast({
          title: "Report setting deleted",
          description: "The report setting has been deleted successfully",
          variant: "default"
        });
        setShowDeleteReportConfirm(false);
        setSelectedReportSetting(null);
        refetchReportSettings();
      },
      onError: (error: Error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to delete report setting",
          variant: "destructive"
        });
      }
    });
  };
  
  // Helper function to get frequency display text
  const getFrequencyDisplay = (setting: ReportSettings) => {
    if (setting.frequency === 'daily') {
      return 'Daily';
    } else if (setting.frequency === 'weekly' && setting.dayOfWeek !== null) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return `Weekly on ${days[setting.dayOfWeek]}`;
    } else if (setting.frequency === 'monthly' && setting.dayOfMonth !== null) {
      return `Monthly on day ${setting.dayOfMonth}`;
    }
    return setting.frequency;
  };
  
  // Get client name by ID
  const getClientName = (clientId: number | null) => {
    if (!clientId) return 'All Clients';
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Unknown Client';
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Report Settings</h2>
          <p className="text-muted-foreground">Manage automated reporting for project resources</p>
        </div>
        <Button 
          onClick={() => setShowAddReportDialog(true)}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          <span>Add Report</span>
        </Button>
      </div>
      
      {isLoadingReportSettings ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : reportSettings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-10 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Report Settings</h3>
            <p className="text-muted-foreground mb-6">
              Create your first report setting to automate resource reporting
            </p>
            <Button onClick={() => setShowAddReportDialog(true)}>
              Create Report Setting
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Sent</TableHead>
                <TableHead>Next Scheduled</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportSettings.map((setting) => (
                <TableRow key={setting.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {setting.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {getFrequencyDisplay(setting)}
                    </div>
                  </TableCell>
                  <TableCell>{setting.recipientEmail}</TableCell>
                  <TableCell>{getClientName(setting.clientId)}</TableCell>
                  <TableCell>
                    <Badge variant={setting.active ? "default" : "outline"}>
                      {setting.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {setting.lastSentAt ? formatDate(new Date(setting.lastSentAt)) : "Never"}
                  </TableCell>
                  <TableCell>
                    {setting.nextScheduledAt ? formatDate(new Date(setting.nextScheduledAt)) : "Not scheduled"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedReportSetting(setting);
                          setShowEditReportDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedReportSetting(setting);
                          setShowDeleteReportConfirm(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Add Report Dialog */}
      <Dialog open={showAddReportDialog} onOpenChange={setShowAddReportDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Add Report Setting</DialogTitle>
            <DialogDescription>
              Create a new automated report for project resources
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateReportSetting)} className="space-y-4 py-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Report Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Weekly Resource Report" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {form.watch('frequency') === 'weekly' && (
                <FormField
                  control={form.control}
                  name="dayOfWeek"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Day of Week</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select day of week" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">Sunday</SelectItem>
                          <SelectItem value="1">Monday</SelectItem>
                          <SelectItem value="2">Tuesday</SelectItem>
                          <SelectItem value="3">Wednesday</SelectItem>
                          <SelectItem value="4">Thursday</SelectItem>
                          <SelectItem value="5">Friday</SelectItem>
                          <SelectItem value="6">Saturday</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {form.watch('frequency') === 'monthly' && (
                <FormField
                  control={form.control}
                  name="dayOfMonth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Day of Month</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select day of month" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.from({ length: 31 }, (_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}>
                              {i + 1}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={form.control}
                name="recipientEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="sales@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Filter by Client</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === "all" ? null : parseInt(value))}
                      value={field.value?.toString() || "all"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">All Clients</SelectItem>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id.toString()}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select a client to filter the report or choose "All Clients" for a global report
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                      <FormDescription>
                        Toggle to enable or disable automatic report generation
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter a description of this report's purpose" 
                        className="min-h-[100px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddReportDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createReportSettingMutation.isPending}
                >
                  {createReportSettingMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>Create</>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Report Dialog */}
      <Dialog open={showEditReportDialog} onOpenChange={setShowEditReportDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Report Setting</DialogTitle>
            <DialogDescription>
              Update the settings for this automated report
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdateReportSetting)} className="space-y-4 py-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Report Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Weekly Resource Report" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {form.watch('frequency') === 'weekly' && (
                <FormField
                  control={form.control}
                  name="dayOfWeek"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Day of Week</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select day of week" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">Sunday</SelectItem>
                          <SelectItem value="1">Monday</SelectItem>
                          <SelectItem value="2">Tuesday</SelectItem>
                          <SelectItem value="3">Wednesday</SelectItem>
                          <SelectItem value="4">Thursday</SelectItem>
                          <SelectItem value="5">Friday</SelectItem>
                          <SelectItem value="6">Saturday</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {form.watch('frequency') === 'monthly' && (
                <FormField
                  control={form.control}
                  name="dayOfMonth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Day of Month</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select day of month" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.from({ length: 31 }, (_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}>
                              {i + 1}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={form.control}
                name="recipientEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="sales@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Filter by Client</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === "all" ? null : parseInt(value))}
                      value={field.value?.toString() || "all"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">All Clients</SelectItem>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id.toString()}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select a client to filter the report or choose "All Clients" for a global report
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                      <FormDescription>
                        Toggle to enable or disable automatic report generation
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter a description of this report's purpose" 
                        className="min-h-[100px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowEditReportDialog(false);
                    setSelectedReportSetting(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateReportSettingMutation.isPending}
                >
                  {updateReportSettingMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>Update</>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteReportConfirm} onOpenChange={setShowDeleteReportConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the report setting.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteReportConfirm(false);
              setSelectedReportSetting(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteReportSetting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteReportSettingMutation.isPending}
            >
              {deleteReportSettingMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>Delete</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default ReportSettingsManager;