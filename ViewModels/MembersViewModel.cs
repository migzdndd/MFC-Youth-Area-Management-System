using System.Collections.ObjectModel;
using System.Windows;
using System.Windows.Input;
using MFCYouthAreaManagementSystem.Models;
using MFCYouthAreaManagementSystem.Repositories;
using MFCYouthAreaManagementSystem.ViewModels.Base;
using MFCYouthAreaManagementSystem.Views.Dialogs;

namespace MFCYouthAreaManagementSystem.ViewModels;

public sealed class MembersViewModel : ObservableObject
{
    private readonly MemberRepository _repo = new();
    private readonly ChapterRepository _chapterRepo = new();
    public ObservableCollection<Member> Members { get; } = new();
    public ObservableCollection<string> Statuses { get; } = new();
    public ObservableCollection<Chapter> Chapters { get; } = new();
    private string _searchText=""; public string SearchText { get=>_searchText; set{if(SetProperty(ref _searchText,value)) LoadMembers();} }
    private string? _selectedStatus; public string? SelectedStatus {get=>_selectedStatus;set{if(SetProperty(ref _selectedStatus,value))LoadMembers();}}
    private Chapter? _selectedChapter; public Chapter? SelectedChapter {get=>_selectedChapter;set{if(SetProperty(ref _selectedChapter,value))LoadMembers();}}
    private Member? _selectedMember; public Member? SelectedMember {get=>_selectedMember;set{if(SetProperty(ref _selectedMember,value))CommandManager.InvalidateRequerySuggested();}}
    public ICommand AddMemberCommand{get;} public ICommand EditMemberCommand{get;} public ICommand ViewMemberCommand{get;} public ICommand DeleteMemberCommand{get;} public ICommand AssignServicesCommand{get;} public ICommand GigCommand{get;} public ICommand RefreshCommand{get;} public ICommand ClearFiltersCommand{get;}

    public MembersViewModel(){AddMemberCommand=new RelayCommand(Add);EditMemberCommand=new RelayCommand(Edit,HasSelection);ViewMemberCommand=new RelayCommand(View,HasSelection);DeleteMemberCommand=new RelayCommand(Delete,HasSelection);AssignServicesCommand=new RelayCommand(AssignServices,HasSelection);GigCommand=new RelayCommand(OpenGig,HasSelection);RefreshCommand=new RelayCommand(Refresh);ClearFiltersCommand=new RelayCommand(ClearFilters);LoadFilters();LoadMembers();}
    private bool HasSelection()=>SelectedMember!=null;
    private Window? Owner=>Application.Current?.MainWindow;
    private void LoadFilters(){Statuses.Clear();Statuses.Add("All Statuses");foreach(var s in Utilities.ApplicationConstants.MemberStatuses)Statuses.Add(s);_selectedStatus="All Statuses";Chapters.Clear();Chapters.Add(new Chapter{ChapterID=0,ChapterName="All Chapters"});foreach(var c in _chapterRepo.GetAll())Chapters.Add(c);_selectedChapter=Chapters.FirstOrDefault();OnPropertyChanged(nameof(SelectedStatus));OnPropertyChanged(nameof(SelectedChapter));}
    public void LoadMembers(){try{long? chapterId = SelectedChapter?.ChapterID is >0?SelectedChapter.ChapterID:null;var status=SelectedStatus=="All Statuses"?null:SelectedStatus;var rows=_repo.Search(SearchText??"",status,chapterId);Members.Clear();foreach(var m in rows)Members.Add(m);}catch(Exception ex){MessageBox.Show(Owner,ex.Message,"Unable to load members",MessageBoxButton.OK,MessageBoxImage.Warning);}}
    private void Add(){var d=new MemberEditorWindow{Owner=Owner};if(d.ShowDialog()==true){Refresh();SelectedMember=Members.FirstOrDefault(x=>x.MemberID==d.SavedMemberId);}}
    private void Edit(){if(SelectedMember==null)return;var id=SelectedMember.MemberID;var d=new MemberEditorWindow(id){Owner=Owner};if(d.ShowDialog()==true){Refresh();SelectedMember=Members.FirstOrDefault(x=>x.MemberID==id);}}
    private void View(){if(SelectedMember!=null)new MemberDetailsWindow(SelectedMember.MemberID){Owner=Owner}.ShowDialog();}
    private void AssignServices(){if(SelectedMember==null)return;var id=SelectedMember.MemberID;var d=new ServiceAssignmentWindow(id,SelectedMember.FullName){Owner=Owner};if(d.ShowDialog()==true){LoadMembers();SelectedMember=Members.FirstOrDefault(x=>x.MemberID==id);}}
    private void OpenGig(){if(SelectedMember!=null)new GigTrackerWindow(SelectedMember.MemberID,SelectedMember.FullName){Owner=Owner}.ShowDialog();}
    private void Delete(){if(SelectedMember==null)return;if(MessageBox.Show(Owner,$"Delete {SelectedMember.FullName}? This cannot be undone.","Confirm delete",MessageBoxButton.YesNo,MessageBoxImage.Warning)!=MessageBoxResult.Yes)return;try{_repo.Delete(SelectedMember.MemberID);LoadMembers();}catch(Exception ex){MessageBox.Show(Owner,ex.Message,"Unable to delete member",MessageBoxButton.OK,MessageBoxImage.Warning);}}
    private void Refresh(){LoadFilters();LoadMembers();}
    private void ClearFilters(){SearchText="";SelectedStatus="All Statuses";SelectedChapter=Chapters.FirstOrDefault();}
}
