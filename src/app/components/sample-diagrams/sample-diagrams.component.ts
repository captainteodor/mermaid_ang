import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { DiagramStateService } from '../../services/diagram-state.service';

@Component({
  selector: 'app-sample-diagrams',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './sample-diagrams.component.html',
  styleUrl: './sample-diagrams.component.scss'
})
export class SampleDiagramsComponent {
  private diagramState = inject(DiagramStateService);
  private dialogRef = inject(MatDialogRef<SampleDiagramsComponent>);

  samples = {
    flowchart: `flowchart TD
    A[Christmas] -->|Get money| B(Go shopping)
    B --> C{Let me think}
    C -->|One| D[Laptop]
    C -->|Two| E[iPhone]
    C -->|Three| F[fa:fa-car Car]`,

    sequence: `sequenceDiagram
    Alice->>+John: Hello John, how are you?
    Alice->>+John: John, can you hear me?
    John-->>-Alice: Hi Alice, I can hear you!
    John-->>-Alice: I feel great!`,

    class: `classDiagram
    Animal <|-- Duck
    Animal <|-- Fish
    Animal <|-- Zebra
    Animal : +int age
    Animal : +String gender
    Animal: +isMammal()
    Animal: +mate()
    class Duck{
      +String beakColor
      +swim()
      +quack()
    }
    class Fish{
      -int sizeInFeet
      -canEat()
    }
    class Zebra{
      +bool is_wild
      +run()
    }`,

    state: `stateDiagram-v2
    [*] --> Still
    Still --> [*]
    Still --> Moving
    Moving --> Still
    Moving --> Crash
    Crash --> [*]`,

    er: `erDiagram
    CUSTOMER }|..|{ DELIVERY-ADDRESS : has
    CUSTOMER ||--o{ ORDER : places
    CUSTOMER ||--o{ INVOICE : "liable for"
    DELIVERY-ADDRESS ||--o{ ORDER : receives
    INVOICE ||--|{ ORDER : covers
    ORDER ||--|{ ORDER-ITEM : includes
    PRODUCT-CATEGORY ||--|{ PRODUCT : contains
    PRODUCT ||--o{ ORDER-ITEM : "ordered in"`,

    gantt: `gantt
    title A Gantt Diagram
    dateFormat  YYYY-MM-DD
    section Section
    A task           :a1, 2014-01-01, 30d
    Another task     :after a1  , 20d
    section Another
    Task in sec      :2014-01-12  , 12d
    another task      : 24d`,

    pie: `pie title Pets adopted by volunteers
    "Dogs" : 386
    "Cats" : 85
    "Rats" : 15`
  };

  categories = [
    { name: 'Flowchart', key: 'flowchart', icon: 'account_tree' },
    { name: 'Sequence Diagram', key: 'sequence', icon: 'format_list_numbered' },
    { name: 'Class Diagram', key: 'class', icon: 'view_module' },
    { name: 'State Diagram', key: 'state', icon: 'hub' },
    { name: 'Entity Relationship', key: 'er', icon: 'share' },
    { name: 'Gantt Chart', key: 'gantt', icon: 'date_range' },
    { name: 'Pie Chart', key: 'pie', icon: 'pie_chart' }
  ];

  selectSample(key: string): void {
    this.diagramState.updateCode(this.samples[key as keyof typeof this.samples], {
      updateDiagram: true,
      resetPanZoom: true
    });
    this.dialogRef.close();
  }

  getSamplePreview(key: string): string {
    // Use type assertion to tell TypeScript that key is valid
    const sample = this.samples[key as keyof typeof this.samples];
    if (!sample) return '';
    return sample.substring(0, 100) + (sample.length > 100 ? '...' : '');
  }
}
