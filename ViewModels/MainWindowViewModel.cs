using MFCYouthAreaManagementSystem.ViewModels.Base;
using System.Windows.Input;

namespace MFCYouthAreaManagementSystem.ViewModels;

public class MainWindowViewModel : ObservableObject
{
    private object? _currentView;
    private string _activeSection = "Dashboard";
    private string _pageTitle = "Dashboard";
    private string _pageSubtitle = "Overview of your MFC Youth Area records and activity.";
    private bool _isSidebarCollapsed;

    public object? CurrentView
    {
        get => _currentView;
        set => SetProperty(ref _currentView, value);
    }

    public string ActiveSection
    {
        get => _activeSection;
        set => SetProperty(ref _activeSection, value);
    }

    public string PageTitle
    {
        get => _pageTitle;
        set => SetProperty(ref _pageTitle, value);
    }

    public string PageSubtitle
    {
        get => _pageSubtitle;
        set => SetProperty(ref _pageSubtitle, value);
    }

    public bool IsSidebarCollapsed
    {
        get => _isSidebarCollapsed;
        set => SetProperty(ref _isSidebarCollapsed, value);
    }

    public ICommand NavigateToDashboardCommand { get; }
    public ICommand NavigateToMembersCommand { get; }
    public ICommand NavigateToChaptersCommand { get; }
    public ICommand NavigateToEventsCommand { get; }
    public ICommand NavigateToServicesCommand { get; }
    public ICommand NavigateToReportsCommand { get; }
    public ICommand ToggleSidebarCommand { get; }

    public MainWindowViewModel()
    {
        NavigateToDashboardCommand = new RelayCommand(ExecuteNavigateToDashboard);
        NavigateToMembersCommand = new RelayCommand(ExecuteNavigateToMembers);
        NavigateToChaptersCommand = new RelayCommand(ExecuteNavigateToChapters);
        NavigateToEventsCommand = new RelayCommand(ExecuteNavigateToEvents);
        NavigateToServicesCommand = new RelayCommand(ExecuteNavigateToServices);
        NavigateToReportsCommand = new RelayCommand(ExecuteNavigateToReports);
        ToggleSidebarCommand = new RelayCommand(() => IsSidebarCollapsed = !IsSidebarCollapsed);

        // Initial view
        ExecuteNavigateToDashboard();
    }

    private void ExecuteNavigateToDashboard()
    {
        ActiveSection = "Dashboard";
        PageTitle = "Dashboard";
        PageSubtitle = "Overview of your MFC Youth Area records, metrics, and activities.";
        CurrentView = new DashboardHomeViewModel();
    }

    private void ExecuteNavigateToMembers()
    {
        ActiveSection = "Members";
        PageTitle = "Members";
        PageSubtitle = "Manage member profiles, chapter assignment, services, and GIG history.";
        CurrentView = new MembersViewModel();
    }

    private void ExecuteNavigateToChapters()
    {
        ActiveSection = "Chapters";
        PageTitle = "Chapters";
        PageSubtitle = "Manage chapters, assigned membership counts, and distribution.";
        CurrentView = new ChaptersViewModel();
    }

    private void ExecuteNavigateToEvents()
    {
        ActiveSection = "Events";
        PageTitle = "Events";
        PageSubtitle = "Coordinate area events, participant registrations, payments, and attendance.";
        CurrentView = new EventsViewModel();
    }

    private void ExecuteNavigateToServices()
    {
        ActiveSection = "Services";
        PageTitle = "Services";
        PageSubtitle = "View the seven MFC Youth service roles and active assigned members.";
        CurrentView = new ServicesViewModel();
    }

    private void ExecuteNavigateToReports()
    {
        ActiveSection = "Reports";
        PageTitle = "Activity Reports";
        PageSubtitle = "Create, filter, analyze, link, and export official Activity Reports.";
        CurrentView = new ReportsViewModel();
    }
}
