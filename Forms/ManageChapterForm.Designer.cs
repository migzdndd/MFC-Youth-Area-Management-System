namespace MFC_Youth_Database.Forms
{
    partial class ManageChapterForm
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.label1 = new System.Windows.Forms.Label();
            this.lblSearch = new System.Windows.Forms.Label();
            this.txtSearch = new System.Windows.Forms.TextBox();
            this.btnAddChapter = new System.Windows.Forms.Button();
            this.btnDelete = new System.Windows.Forms.Button();
            this.lvChapters = new System.Windows.Forms.ListView();
            this.colChapter = ((System.Windows.Forms.ColumnHeader)(new System.Windows.Forms.ColumnHeader()));
            this.colMembers = ((System.Windows.Forms.ColumnHeader)(new System.Windows.Forms.ColumnHeader()));
            this.lblTotalChapters = new System.Windows.Forms.Label();
            this.SuspendLayout();
            // 
            // label1
            // 
            this.label1.Location = new System.Drawing.Point(0, 0);
            this.label1.Name = "label1";
            this.label1.Size = new System.Drawing.Size(100, 23);
            this.label1.TabIndex = 0;
            // 
            // lblSearch
            // 
            this.lblSearch.AutoSize = true;
            this.lblSearch.Font = new System.Drawing.Font("Segoe UI", 10F);
            this.lblSearch.Location = new System.Drawing.Point(12, 78);
            this.lblSearch.Name = "lblSearch";
            this.lblSearch.Size = new System.Drawing.Size(105, 19);
            this.lblSearch.TabIndex = 1;
            this.lblSearch.Text = "Search Chapter:";
            // 
            // txtSearch
            // 
            this.txtSearch.Font = new System.Drawing.Font("Segoe UI", 8.25F);
            this.txtSearch.Location = new System.Drawing.Point(123, 78);
            this.txtSearch.Name = "txtSearch";
            this.txtSearch.Size = new System.Drawing.Size(192, 22);
            this.txtSearch.TabIndex = 2;
            this.txtSearch.TextChanged += new System.EventHandler(this.txtSearch_TextChanged);
            // 
            // btnAddChapter
            // 
            this.btnAddChapter.BackColor = System.Drawing.Color.MediumSeaGreen;
            this.btnAddChapter.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.btnAddChapter.Font = new System.Drawing.Font("Segoe UI", 8.25F, System.Drawing.FontStyle.Bold);
            this.btnAddChapter.Location = new System.Drawing.Point(377, 36);
            this.btnAddChapter.Name = "btnAddChapter";
            this.btnAddChapter.Size = new System.Drawing.Size(104, 36);
            this.btnAddChapter.TabIndex = 4;
            this.btnAddChapter.Text = "Add Chapter";
            this.btnAddChapter.UseVisualStyleBackColor = false;
            this.btnAddChapter.Click += new System.EventHandler(this.btnAddChapter_Click);
            // 
            // btnDelete
            // 
            this.btnDelete.BackColor = System.Drawing.Color.Crimson;
            this.btnDelete.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.btnDelete.Font = new System.Drawing.Font("Segoe UI", 8.25F, System.Drawing.FontStyle.Bold);
            this.btnDelete.Location = new System.Drawing.Point(377, 78);
            this.btnDelete.Name = "btnDelete";
            this.btnDelete.Size = new System.Drawing.Size(104, 36);
            this.btnDelete.TabIndex = 5;
            this.btnDelete.Text = "Delete  Chapter";
            this.btnDelete.UseVisualStyleBackColor = false;
            this.btnDelete.Click += new System.EventHandler(this.btnDelete_Click);
            // 
            // lvChapters
            // 
            this.lvChapters.Columns.AddRange(new System.Windows.Forms.ColumnHeader[] {
            this.colChapter,
            this.colMembers});
            this.lvChapters.Font = new System.Drawing.Font("Segoe UI", 8.25F);
            this.lvChapters.FullRowSelect = true;
            this.lvChapters.GridLines = true;
            this.lvChapters.HideSelection = false;
            this.lvChapters.Location = new System.Drawing.Point(12, 120);
            this.lvChapters.MultiSelect = false;
            this.lvChapters.Name = "lvChapters";
            this.lvChapters.Size = new System.Drawing.Size(402, 314);
            this.lvChapters.TabIndex = 6;
            this.lvChapters.UseCompatibleStateImageBehavior = false;
            this.lvChapters.View = System.Windows.Forms.View.Details;
            // 
            // colChapter
            // 
            this.colChapter.Text = "Chapter Name";
            this.colChapter.Width = 322;
            // 
            // colMembers
            // 
            this.colMembers.Text = "Members";
            this.colMembers.TextAlign = System.Windows.Forms.HorizontalAlignment.Center;
            this.colMembers.Width = 80;
            // 
            // lblTotalChapters
            // 
            this.lblTotalChapters.AutoSize = true;
            this.lblTotalChapters.Location = new System.Drawing.Point(13, 439);
            this.lblTotalChapters.Name = "lblTotalChapters";
            this.lblTotalChapters.Size = new System.Drawing.Size(88, 13);
            this.lblTotalChapters.TabIndex = 7;
            this.lblTotalChapters.Text = "Total Chapters: 0";
            // 
            // ManageChapterForm
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(493, 461);
            this.Controls.Add(this.lblTotalChapters);
            this.Controls.Add(this.lvChapters);
            this.Controls.Add(this.btnDelete);
            this.Controls.Add(this.btnAddChapter);
            this.Controls.Add(this.txtSearch);
            this.Controls.Add(this.lblSearch);
            this.Controls.Add(this.label1);
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedDialog;
            this.Name = "ManageChapterForm";
            this.Text = "Manage Chapter";
            this.Load += new System.EventHandler(this.ManageChapterForm_Load);
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.Label label1;
        private System.Windows.Forms.Label lblSearch;
        private System.Windows.Forms.TextBox txtSearch;
        private System.Windows.Forms.Button btnAddChapter;
        private System.Windows.Forms.Button btnDelete;
        private System.Windows.Forms.ListView lvChapters;
        private System.Windows.Forms.ColumnHeader colChapter;
        private System.Windows.Forms.ColumnHeader colMembers;
        private System.Windows.Forms.Label lblTotalChapters;
    }
}